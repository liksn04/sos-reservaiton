import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { fetchReservationPolicySeasons } from '../useReservationPolicySeasons';
import {
  computeIsNextDay,
  validatePastDatePolicy,
  validatePastStartTimePolicy,
  validatePurposeAccessPolicy,
  validateReservationTime,
  validateSameDayPolicy,
} from '../../utils/validation';
import { isPastReservation } from '../../utils/time';
import type { Purpose } from '../../types';

// ── 신규 예약 ────────────────────────────────────────────────────────────
interface CreatePayload {
  hostId: string;
  date: string;
  startTime: string;
  endTime: string;
  teamName: string;
  peopleCount: number;
  purpose: Purpose;
  invitees: string[];
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const purposeAccessError = validatePurposeAccessPolicy(payload.purpose, Boolean(profile?.is_admin));
      if (purposeAccessError) throw new Error(purposeAccessError.message);

      const pastDateError = validatePastDatePolicy(payload.date);
      if (pastDateError) throw new Error(pastDateError.message);

      const policySeasons = await fetchReservationPolicySeasons(false);
      const sameDayError = validateSameDayPolicy(payload.date, payload.purpose, policySeasons);
      if (sameDayError) throw new Error(sameDayError.message);

      // Edge case: min date/time UI를 우회해 과거 시간을 제출한 경우 차단
      // Edge case: 모달을 오래 열어 둔 뒤 선택한 슬롯이 이미 시작된 경우 차단
      // Edge case: 클라이언트에서 직접 mutationFn을 호출한 경우도 동일 정책 적용
      const pastStartError = validatePastStartTimePolicy(payload.date, payload.startTime);
      if (pastStartError) throw new Error(pastStartError.message);

      const { data: existingReservations, error: existingReservationsErr } = await supabase
        .from('reservations')
        .select('id, host_id, date, start_time, end_time, is_next_day, team_name, people_count, purpose, created_at');
      if (existingReservationsErr) throw existingReservationsErr;

      const reservationTimeError = validateReservationTime(
        payload.date,
        payload.startTime,
        payload.endTime,
        existingReservations ?? [],
        null,
        payload.purpose,
        policySeasons,
        undefined,
        payload.teamName,
      );
      if (reservationTimeError) throw new Error(reservationTimeError.message);

      const isNextDay = computeIsNextDay(payload.startTime, payload.endTime);

      const { data: newRes, error: insertErr } = await supabase
        .from('reservations')
        .insert({
          host_id: payload.hostId,
          date: payload.date,
          start_time: payload.startTime,
          end_time: payload.endTime,
          is_next_day: isNextDay,
          team_name: payload.teamName,
          people_count: payload.peopleCount,
          purpose: payload.purpose,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (payload.purpose === '합주' && payload.invitees.length > 0 && newRes) {
        const { error: inviteErr } = await supabase
          .from('reservation_invitees')
          .insert(payload.invitees.map((uid) => ({ reservation_id: newRes.id, user_id: uid })));
        if (inviteErr) throw inviteErr;
      }

      return newRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: ['reservations', 'history'] });
    },
  });
}

// ── 예약 수정 ────────────────────────────────────────────────────────────
interface UpdatePayload {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  teamName: string;
  peopleCount: number;
  purpose: Purpose;
  invitees: string[];
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const purposeAccessError = validatePurposeAccessPolicy(payload.purpose, Boolean(profile?.is_admin));
      if (purposeAccessError) throw new Error(purposeAccessError.message);

      const pastDateError = validatePastDatePolicy(payload.date);
      if (pastDateError) throw new Error(pastDateError.message);

      const policySeasons = await fetchReservationPolicySeasons(false);
      const sameDayError = validateSameDayPolicy(payload.date, payload.purpose, policySeasons);
      if (sameDayError) throw new Error(sameDayError.message);

      // Edge case: 수정 흐름에서도 과거 시작 시간으로 바꾸는 우회를 차단
      const pastStartError = validatePastStartTimePolicy(payload.date, payload.startTime);
      if (pastStartError) throw new Error(pastStartError.message);

      const { data: existingReservations, error: existingReservationsErr } = await supabase
        .from('reservations')
        .select('id, host_id, date, start_time, end_time, is_next_day, team_name, people_count, purpose, created_at');
      if (existingReservationsErr) throw existingReservationsErr;

      const reservationTimeError = validateReservationTime(
        payload.date,
        payload.startTime,
        payload.endTime,
        existingReservations ?? [],
        payload.id,
        payload.purpose,
        policySeasons,
        undefined,
        payload.teamName,
      );
      if (reservationTimeError) throw new Error(reservationTimeError.message);

      const isNextDay = computeIsNextDay(payload.startTime, payload.endTime);

      if (isPastReservation(payload.date, payload.endTime, isNextDay) && !profile?.is_admin) {
        throw new Error('지난 일정은 수정할 수 없습니다.');
      }

      const { data: currentInvitees, error: currentInviteesErr } = await supabase
        .from('reservation_invitees')
        .select('user_id')
        .eq('reservation_id', payload.id);
      if (currentInviteesErr) throw currentInviteesErr;

      const nextInvitees = payload.purpose === '합주' ? new Set(payload.invitees) : new Set<string>();
      const previousInvitees = new Set((currentInvitees ?? []).map((invitee) => invitee.user_id as string));
      const inviteesToRemove = [...previousInvitees].filter((userId) => !nextInvitees.has(userId));
      const inviteesToAdd = [...nextInvitees].filter((userId) => !previousInvitees.has(userId));

      const { error: updateErr } = await supabase
        .from('reservations')
        .update({
          date: payload.date,
          start_time: payload.startTime,
          end_time: payload.endTime,
          is_next_day: isNextDay,
          team_name: payload.teamName,
          people_count: payload.peopleCount,
          purpose: payload.purpose,
        })
        .eq('id', payload.id);

      if (updateErr) throw updateErr;

      if (inviteesToRemove.length > 0) {
        const { error: deleteInviteesErr } = await supabase
          .from('reservation_invitees')
          .delete()
          .eq('reservation_id', payload.id)
          .in('user_id', inviteesToRemove);
        if (deleteInviteesErr) throw deleteInviteesErr;
      }

      if (inviteesToAdd.length > 0) {
        const { error: inviteErr } = await supabase
          .from('reservation_invitees')
          .insert(inviteesToAdd.map((uid) => ({ reservation_id: payload.id, user_id: uid })));
        if (inviteErr) throw inviteErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      queryClient.invalidateQueries({ queryKey: ['reservations', 'history'] });
    },
  });
}

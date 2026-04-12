import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { computeIsNextDay, validatePastDatePolicy, validatePastStartTimePolicy } from '../../utils/validation';
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

  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const pastDateError = validatePastDatePolicy(payload.date);
      if (pastDateError) throw new Error(pastDateError.message);

      // Edge case: min date/time UI를 우회해 과거 시간을 제출한 경우 차단
      // Edge case: 모달을 오래 열어 둔 뒤 선택한 슬롯이 이미 시작된 경우 차단
      // Edge case: 클라이언트에서 직접 mutationFn을 호출한 경우도 동일 정책 적용
      const pastStartError = validatePastStartTimePolicy(payload.date, payload.startTime);
      if (pastStartError) throw new Error(pastStartError.message);

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

import { useAuth } from '../../context/AuthContext';
import { isPastReservation } from '../../utils/time';

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const pastDateError = validatePastDatePolicy(payload.date);
      if (pastDateError) throw new Error(pastDateError.message);

      // Edge case: 수정 흐름에서도 과거 시작 시간으로 바꾸는 우회를 차단
      const pastStartError = validatePastStartTimePolicy(payload.date, payload.startTime);
      if (pastStartError) throw new Error(pastStartError.message);

      const isNextDay = computeIsNextDay(payload.startTime, payload.endTime);

      if (isPastReservation(payload.date, payload.endTime, isNextDay) && !profile?.is_admin) {
        throw new Error('지난 일정은 수정할 수 없습니다.');
      }

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

      // 초대 목록 교체 (합주면 새 목록으로, 아니면 전부 삭제)
      await supabase
        .from('reservation_invitees')
        .delete()
        .eq('reservation_id', payload.id);

      if (payload.purpose === '합주' && payload.invitees.length > 0) {
        const { error: inviteErr } = await supabase
          .from('reservation_invitees')
          .insert(payload.invitees.map((uid) => ({ reservation_id: payload.id, user_id: uid })));
        if (inviteErr) throw inviteErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

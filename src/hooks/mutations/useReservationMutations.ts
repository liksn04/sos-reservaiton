import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { computeIsNextDay } from '../../utils/validation';
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
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
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

  return useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const isNextDay = computeIsNextDay(payload.startTime, payload.endTime);

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
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

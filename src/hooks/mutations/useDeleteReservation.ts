import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { isPastReservation } from '../../utils/time';

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // 삭제 전 예약의 시간을 확인하기 위해 정보를 조회합니다.
      const { data: res, error: fetchErr } = await supabase
        .from('reservations')
        .select('date, end_time, is_next_day')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      if (isPastReservation(res.date, res.end_time, res.is_next_day) && !profile?.is_admin) {
        throw new Error('지난 일정은 삭제할 수 없습니다.');
      }

      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

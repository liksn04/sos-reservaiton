import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { ReservationChangeLog } from '../types';

export function useReservationChangeLog(reservationId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reservations.history(reservationId),
    enabled: enabled && Boolean(reservationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservation_change_log')
        .select('id, reservation_id, actor_id, actor_name, action, previous_data, next_data, created_at')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as ReservationChangeLog[];
    },
  });
}

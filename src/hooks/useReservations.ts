import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { ReservationWithDetails } from '../types';

export function useReservations() {
  return useQuery({
    queryKey: queryKeys.reservations.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          host_id,
          date,
          start_time,
          end_time,
          is_next_day,
          team_name,
          people_count,
          purpose,
          created_at,
          host:profiles!host_id(id, display_name, avatar_url),
          reservation_invitees(
            user_id,
            profile:profiles(id, display_name, avatar_url)
          )
        `)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as ReservationWithDetails[];
    },
  });
}

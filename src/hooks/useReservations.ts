import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ReservationWithDetails } from '../types';

export function useReservations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reservations'],
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

  // Supabase Realtime — reservations 또는 invitees 변경 시 쿼리 무효화
  useEffect(() => {
    // 채널 이름을 유니크하게 생성하여 중복 방지 (HMR 또는 Strict Mode 대응)
    const channelId = `reservations-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          console.log('🔄 Realtime: Reservations changed, invalidating...');
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservation_invitees' },
        () => {
          console.log('🔄 Realtime: Invitees changed, invalidating...');
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

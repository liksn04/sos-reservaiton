import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { EventParticipant } from '../types';

export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: queryKeys.events.participants.byEvent(eventId),
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          user_id,
          attended,
          joined_at,
          profile:profiles(id, display_name, avatar_url, part)
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as EventParticipant[];
    },
    enabled: !!eventId,
  });
}

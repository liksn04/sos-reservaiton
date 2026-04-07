import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { ClubEventWithDetails } from '../types';

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_events')
        .select(`
          id,
          category_id,
          title,
          description,
          location,
          start_date,
          start_time,
          end_date,
          end_time,
          cover_image_url,
          is_public,
          created_by,
          created_at,
          updated_at,
          category:event_categories(*),
          creator:profiles!created_by(id, display_name, avatar_url),
          participants:event_participants(
            id,
            user_id,
            attended,
            profile:profiles(id, display_name, avatar_url)
          )
        `)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return (data ?? []) as unknown as ClubEventWithDetails[];
    },
  });
}

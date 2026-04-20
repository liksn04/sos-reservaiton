import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { buildEventParticipantSummaryMap } from '../utils/eventParticipantSummary';

export function useEventParticipantSummaries(eventIds: readonly string[]) {
  const { profile } = useAuth();

  const normalizedEventIds = useMemo(
    () => [...new Set(eventIds.filter(Boolean))].sort((left, right) => left.localeCompare(right)),
    [eventIds],
  );

  return useQuery({
    queryKey: queryKeys.events.summaries.list(normalizedEventIds),
    enabled: normalizedEventIds.length > 0 && Boolean(profile?.id),
    queryFn: async () => {
      const [countResult, viewerResult] = await Promise.all([
        profile?.is_admin
          ? supabase
            .from('event_participants')
            .select('event_id')
            .in('event_id', normalizedEventIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('event_participants')
          .select('event_id')
          .eq('user_id', profile!.id)
          .in('event_id', normalizedEventIds),
      ]);

      if (countResult.error) throw countResult.error;
      if (viewerResult.error) throw viewerResult.error;

      return buildEventParticipantSummaryMap({
        eventIds: normalizedEventIds,
        countRows: countResult.data ?? [],
        viewerRows: viewerResult.data ?? [],
        hasExactParticipantCount: Boolean(profile?.is_admin),
      });
    },
  });
}

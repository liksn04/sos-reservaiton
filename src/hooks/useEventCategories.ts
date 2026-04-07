import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { EventCategory } from '../types';

export function useEventCategories() {
  return useQuery({
    queryKey: queryKeys.events.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as EventCategory[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

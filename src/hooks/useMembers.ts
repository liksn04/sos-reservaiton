import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { Profile } from '../types';

/** 승인된 부원 목록 (합주 초대 선택용) */
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, part, bio')
        .eq('status', 'approved')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

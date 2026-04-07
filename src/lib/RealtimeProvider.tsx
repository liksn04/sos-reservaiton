import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryKeys } from './queryKeys';

/**
 * 앱 전체에서 Supabase Realtime 채널을 단 하나만 유지합니다.
 * 각 useQuery 훅에서 개별 채널을 열면 탭 이동마다 채널이 생성/삭제되어
 * 커넥션 낭비 및 메모리 누수가 발생하므로 여기서 통합 관리합니다.
 *
 * QueryClientProvider 바로 아래에 배치해야 useQueryClient()가 동작합니다.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('app-global-realtime')
      // 예약
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservation_invitees' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      })
      // 행사
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_events' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.categories });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.participants.all });
      })
      // 예산
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return <>{children}</>;
}

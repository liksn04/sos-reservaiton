import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from './supabase';
import { queryKeys } from './queryKeys';
import {
  getInitialOnlineStatus,
  resolveRealtimeFeatureEnabled,
  shouldConnectRealtime,
} from './realtime';

/**
 * 앱 전체에서 Supabase Realtime 채널을 단 하나만 유지합니다.
 * 각 useQuery 훅에서 개별 채널을 열면 탭 이동마다 채널이 생성/삭제되어
 * 커넥션 낭비 및 메모리 누수가 발생하므로 여기서 통합 관리합니다.
 *
 * QueryClientProvider 바로 아래에 배치해야 useQueryClient()가 동작합니다.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { loading: authLoading, profile, session } = useAuth();
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const isRealtimeFeatureEnabled = useMemo(() => {
    return resolveRealtimeFeatureEnabled({
      isDev: import.meta.env.DEV,
      override: import.meta.env.VITE_ENABLE_SUPABASE_REALTIME,
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const shouldSubscribe = shouldConnectRealtime({
      authLoading,
      hasAccessToken: Boolean(session?.access_token),
      isApproved: profile?.status === 'approved',
      isOnline,
      isRealtimeFeatureEnabled,
    });

    if (!shouldSubscribe || !session?.access_token) {
      return undefined;
    }

    supabase.realtime.setAuth(session.access_token);

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
        queryClient.invalidateQueries({ queryKey: queryKeys.events.summaries.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      })
      // 예산
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_fee_policies' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.fees.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'membership_fee_records' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.budget.fees.all });
      })
      .subscribe((status, err) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && import.meta.env.DEV) {
          console.warn('Supabase Realtime 연결에 실패해 자동 갱신을 비활성화합니다.', {
            status,
            error: err,
          });
          void supabase.removeChannel(channel);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    authLoading,
    isOnline,
    isRealtimeFeatureEnabled,
    profile?.status,
    queryClient,
    session?.access_token,
  ]);

  return <>{children}</>;
}

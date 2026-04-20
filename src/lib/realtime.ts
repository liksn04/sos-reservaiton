interface RealtimeFeatureFlagOptions {
  isDev: boolean;
  override?: string;
}

interface RealtimeConnectionOptions {
  authLoading: boolean;
  hasAccessToken: boolean;
  isApproved: boolean;
  isOnline: boolean;
  isRealtimeFeatureEnabled: boolean;
}

/**
 * 개발 환경에서는 외부 WebSocket 실패가 콘솔을 오염시키기 쉬워 기본 비활성화합니다.
 * 필요하면 `VITE_ENABLE_SUPABASE_REALTIME=true`로 로컬에서도 명시적으로 활성화할 수 있습니다.
 */
export function resolveRealtimeFeatureEnabled({
  isDev,
  override,
}: RealtimeFeatureFlagOptions): boolean {
  if (override === 'true') return true;
  if (override === 'false') return false;

  return !isDev;
}

/**
 * Realtime 연결 여부를 단일 기준으로 관리합니다.
 *
 * 처리하는 예외:
 * 1. 인증 로딩 중일 때는 로그인 화면/토큰 복구 과정에서 성급히 연결하지 않습니다.
 * 2. 세션 토큰이나 승인 프로필이 없으면 RLS 대상 채널을 열지 않습니다.
 * 3. 브라우저가 offline 상태면 불필요한 WebSocket 재시도를 막습니다.
 */
export function shouldConnectRealtime({
  authLoading,
  hasAccessToken,
  isApproved,
  isOnline,
  isRealtimeFeatureEnabled,
}: RealtimeConnectionOptions): boolean {
  if (!isRealtimeFeatureEnabled) return false;
  if (authLoading) return false;
  if (!hasAccessToken) return false;
  if (!isApproved) return false;
  if (!isOnline) return false;

  return true;
}

export function getInitialOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') return true;

  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}

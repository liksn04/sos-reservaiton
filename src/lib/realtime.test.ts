import { describe, expect, it } from 'vitest';
import {
  getInitialOnlineStatus,
  resolveRealtimeFeatureEnabled,
  shouldConnectRealtime,
} from './realtime';

describe('realtime feature flags', () => {
  it('개발 환경에서는 명시적 설정이 없으면 Realtime을 끈다', () => {
    expect(resolveRealtimeFeatureEnabled({ isDev: true })).toBe(false);
  });

  it('프로덕션에서는 명시적 설정이 없으면 Realtime을 켠다', () => {
    expect(resolveRealtimeFeatureEnabled({ isDev: false })).toBe(true);
  });

  it('환경 변수 override가 있으면 개발/프로덕션 기본값보다 우선한다', () => {
    expect(resolveRealtimeFeatureEnabled({ isDev: true, override: 'true' })).toBe(true);
    expect(resolveRealtimeFeatureEnabled({ isDev: false, override: 'false' })).toBe(false);
  });
});

describe('shouldConnectRealtime', () => {
  it('인증 완료된 승인 사용자이면서 온라인이고 기능이 켜져 있을 때만 연결한다', () => {
    expect(shouldConnectRealtime({
      authLoading: false,
      hasAccessToken: true,
      isApproved: true,
      isOnline: true,
      isRealtimeFeatureEnabled: true,
    })).toBe(true);
  });

  it('세션, 승인, 온라인 상태 중 하나라도 없으면 연결하지 않는다', () => {
    expect(shouldConnectRealtime({
      authLoading: false,
      hasAccessToken: false,
      isApproved: true,
      isOnline: true,
      isRealtimeFeatureEnabled: true,
    })).toBe(false);

    expect(shouldConnectRealtime({
      authLoading: false,
      hasAccessToken: true,
      isApproved: false,
      isOnline: true,
      isRealtimeFeatureEnabled: true,
    })).toBe(false);

    expect(shouldConnectRealtime({
      authLoading: false,
      hasAccessToken: true,
      isApproved: true,
      isOnline: false,
      isRealtimeFeatureEnabled: true,
    })).toBe(false);
  });

  it('인증 로딩 중이거나 기능이 꺼져 있으면 연결하지 않는다', () => {
    expect(shouldConnectRealtime({
      authLoading: true,
      hasAccessToken: true,
      isApproved: true,
      isOnline: true,
      isRealtimeFeatureEnabled: true,
    })).toBe(false);

    expect(shouldConnectRealtime({
      authLoading: false,
      hasAccessToken: true,
      isApproved: true,
      isOnline: true,
      isRealtimeFeatureEnabled: false,
    })).toBe(false);
  });
});

describe('getInitialOnlineStatus', () => {
  it('브라우저가 없는 환경에서는 안전하게 true를 반환한다', () => {
    expect(getInitialOnlineStatus()).toBe(true);
  });
});

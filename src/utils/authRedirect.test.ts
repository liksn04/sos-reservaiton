import { describe, expect, it } from 'vitest';
import { resolveAuthenticatedRoute } from './authRedirect';
import type { Profile } from '../types';

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: overrides.id ?? 'user-1',
    kakao_id: overrides.kakao_id ?? null,
    display_name: overrides.display_name ?? '홍길동',
    avatar_url: overrides.avatar_url ?? null,
    part: overrides.part ?? [],
    bio: overrides.bio ?? null,
    status: overrides.status ?? 'approved',
    is_admin: overrides.is_admin ?? false,
    banned_at: overrides.banned_at ?? null,
    banned_reason: overrides.banned_reason ?? null,
    banned_by: overrides.banned_by ?? null,
    created_at: overrides.created_at ?? '2026-04-20T00:00:00.000Z',
  };
}

describe('authRedirect', () => {
  it('프로필이 없거나 이름이 비어 있어도 강제 설정 화면으로 보내지 않는다', () => {
    expect(resolveAuthenticatedRoute(null)).toBe('/');
    expect(resolveAuthenticatedRoute(createProfile({ display_name: '   ' }))).toBe('/');
  });

  it('차단된 계정은 차단 화면으로 보낸다', () => {
    expect(resolveAuthenticatedRoute(createProfile({ status: 'banned' }))).toBe('/banned');
  });

  it('승인 사용자는 메인 화면으로 보낸다', () => {
    expect(resolveAuthenticatedRoute(createProfile())).toBe('/');
  });

  it('레거시 상태값이 남아 있어도 대기 화면으로 보내지 않고 앱 진입 경로를 유지한다', () => {
    expect(resolveAuthenticatedRoute(createProfile({ status: 'pending' }))).toBe('/');
    expect(resolveAuthenticatedRoute(createProfile({ status: 'rejected' }))).toBe('/');
  });
});

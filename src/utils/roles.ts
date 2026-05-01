import type { MemberRole, Profile } from '../types';

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  member: '일반 회원',
  operations: '운영진',
  treasurer: '총무',
  president: '회장',
};

export function canManageReservations(profile: Pick<Profile, 'is_admin' | 'member_role'> | null | undefined) {
  return Boolean(
    profile?.is_admin ||
    profile?.member_role === 'operations' ||
    profile?.member_role === 'president',
  );
}

export function canManageBudget(profile: Pick<Profile, 'is_admin' | 'member_role'> | null | undefined) {
  return Boolean(
    profile?.is_admin ||
    profile?.member_role === 'treasurer' ||
    profile?.member_role === 'president',
  );
}

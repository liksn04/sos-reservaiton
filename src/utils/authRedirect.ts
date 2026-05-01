import type { Profile } from '../types';

export function shouldRequireProfileSetup(profile: Profile | null) {
  void profile;
  return false;
}

export function isBlockedProfile(profile: Profile | null) {
  return profile?.status === 'banned';
}

export function resolveAuthenticatedRoute(profile: Profile | null) {
  if (isBlockedProfile(profile)) {
    return '/banned';
  }

  return '/';
}

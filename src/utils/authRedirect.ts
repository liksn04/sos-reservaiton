import type { Profile } from '../types';

function isBlank(value: string | null | undefined) {
  return !value || value.trim() === '';
}

export function shouldRequireProfileSetup(profile: Profile | null) {
  return !profile || isBlank(profile.display_name);
}

export function isBlockedProfile(profile: Profile | null) {
  return profile?.status === 'banned';
}

export function resolveAuthenticatedRoute(profile: Profile | null) {
  if (shouldRequireProfileSetup(profile)) {
    return '/profile/setup';
  }

  if (isBlockedProfile(profile)) {
    return '/banned';
  }

  return '/';
}

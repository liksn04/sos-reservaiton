import { supabase } from '../lib/supabase';
import { getSafeImageExtension, validateImageFile } from '../utils/fileUpload';
import type { Part } from '../types';

export interface ProfileUpdatePayload {
  display_name: string;
  part: Part[];
  bio: string | null;
  avatar_url?: string;
}

export async function uploadAvatarForUser(file: File, userId: string): Promise<string> {
  validateImageFile(file);
  const ext = getSafeImageExtension(file);
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadErr) throw uploadErr;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * Returns true if another approved profile already uses this display_name.
 * Conservative: if the check itself errors (e.g. RLS hiccup), returns false so the
 * caller does not block save on a transient lookup failure.
 */
export async function isDisplayNameTaken(displayName: string, currentUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('display_name', displayName)
    .neq('id', currentUserId)
    .limit(1);
  if (error) {
    console.error('닉네임 중복 확인 실패:', error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function updateProfile(userId: string, payload: ProfileUpdatePayload): Promise<void> {
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
}

import { supabase } from '../lib/supabase';
import { getSafeImageExtension, validateImageFile } from '../utils/fileUpload';

export async function uploadReceiptForUser(file: File, userId: string): Promise<string> {
  validateImageFile(file);
  const ext = getSafeImageExtension(file);
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl;
}

export async function uploadReceiptForCurrentUser(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('로그인이 필요합니다.');
  return uploadReceiptForUser(file, userData.user.id);
}

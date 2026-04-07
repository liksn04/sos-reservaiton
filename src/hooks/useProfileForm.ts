import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Part } from '../types';

interface InitialValues {
  displayName?: string;
  part?: Part;
  bio?: string;
  avatarUrl?: string | null;
}

interface UseProfileFormOptions {
  initialValues?: InitialValues;
  onSuccess?: () => void;
}

export function useProfileForm({ initialValues, onSuccess }: UseProfileFormOptions = {}) {
  const { session, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initialValues?.displayName ?? '');
  const [part, setPart] = useState<Part>(initialValues?.part ?? 'guitar');
  const [bio, setBio] = useState(initialValues?.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /** 파일 선택 시 미리보기 URL 생성 */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /** 현재 표시할 아바타: 미리보기 > 저장된 URL > null */
  const currentAvatar = avatarPreview ?? initialValues?.avatarUrl ?? null;

  /** 폼 제출 — 업로드 + profiles 업데이트 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    if (!displayName.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setIsPending(true);
    setError('');
    setSuccess(false);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${session.user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          part,
          bio: bio.trim() || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', session.user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

  return {
    // 폼 값
    displayName, setDisplayName,
    part, setPart,
    bio, setBio,
    // 아바타
    currentAvatar,
    fileInputRef,
    handleFileChange,
    // 제출
    handleSubmit,
    isPending,
    error,
    success,
  };
}

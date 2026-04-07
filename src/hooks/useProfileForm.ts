import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Part } from '../types';

interface InitialValues {
  displayName?: string;
  part?: Part[];
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
  const [part, setPart] = useState<Part[]>(initialValues?.part ?? []);
  const [bio, setBio] = useState(initialValues?.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /** [규칙 4] 중복 닉네임 감지 플래그 */
  const [showDuplicateToggle, setShowDuplicateToggle] = useState(false);
  /** [규칙 4] 사용자가 "동명이인" 토글을 활성화했는지 여부 */
  const [allowDuplicateName, setAllowDuplicateName] = useState(false);

  /** 파일 선택 시 미리보기 URL 생성 */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /** 현재 표시할 아바타: 미리보기 > 저장된 URL > null */
  const currentAvatar = avatarPreview ?? initialValues?.avatarUrl ?? null;

  /**
   * [규칙 4] 닉네임 변경 시 동명이인 토글 초기화.
   * 다른 이름을 입력했을 때 이전 중복 감지 상태가 남지 않도록 처리.
   */
  function handleDisplayNameChange(value: string) {
    setDisplayName(value);
    // Edge case: 이름이 바뀌면 중복 토글 초기화
    setShowDuplicateToggle(false);
    setAllowDuplicateName(false);
    setError('');
  }

  /** [신규] 파트 다중 선택 토글 로직 */
  function togglePart(selectedPart: Part) {
    setPart((prev) =>
      prev.includes(selectedPart)
        ? prev.filter((p) => p !== selectedPart)
        : [...prev, selectedPart]
    );
    setError('');
  }

  /** 폼 제출 — 중복 닉네임 체크 + 업로드 + profiles 업데이트 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;

    // Edge case: 빈 닉네임
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setIsPending(true);
    setError('');
    setSuccess(false);

    try {
      // [규칙 4] 중복 닉네임 체크 (동명이인 허용 플래그가 없을 때만)
      if (!allowDuplicateName) {
        const { data: existing, error: checkErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('display_name', trimmedName)
          .neq('id', session.user.id) // 자기 자신은 제외
          .limit(1);

        // Edge case: Supabase 조회 실패
        if (checkErr) {
          console.error('닉네임 중복 확인 실패:', checkErr);
          // 조회 실패 시 저장을 막지 않고 계속 진행 (보수적 선택)
        }

        if (existing && existing.length > 0) {
          // 중복 발견 → 동명이인 토글 노출
          setShowDuplicateToggle(true);
          setError('이미 사용 중인 닉네임입니다.');
          setIsPending(false);
          return;
        }
      }

      let avatarUrl: string | undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        // Edge case: 확장자가 없는 파일
        const safePath = `${session.user.id}/avatar.${ext ?? 'jpg'}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(safePath, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(safePath).data.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: trimmedName,
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
      setShowDuplicateToggle(false);
      setAllowDuplicateName(false);
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
    displayName,
    setDisplayName: handleDisplayNameChange,
    part, togglePart,
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
    // [규칙 4] 동명이인 토글
    showDuplicateToggle,
    allowDuplicateName,
    setAllowDuplicateName,
  };
}

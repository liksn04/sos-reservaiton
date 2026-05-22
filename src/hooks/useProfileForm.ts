import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateImageFile } from '../utils/fileUpload';
import {
  isDisplayNameTaken,
  updateProfile,
  uploadAvatarForUser,
} from '../services/profileService';
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

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  /** 파일 선택 시 미리보기 URL 생성 */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드 파일이 올바르지 않습니다.');
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
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
      if (!allowDuplicateName && await isDisplayNameTaken(trimmedName, session.user.id)) {
        setShowDuplicateToggle(true);
        setError('이미 사용 중인 닉네임입니다.');
        setIsPending(false);
        return;
      }

      const avatarUrl = avatarFile
        ? await uploadAvatarForUser(avatarFile, session.user.id)
        : undefined;

      await updateProfile(session.user.id, {
        display_name: trimmedName,
        part,
        bio: bio.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

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

import AvatarUploader from './AvatarUploader';
import { useProfileForm } from '../hooks/useProfileForm';
import type { Part, Profile } from '../types';

const PARTS: { value: Part; label: string }[] = [
  { value: 'vocal',    label: '보컬' },
  { value: 'guitar',   label: '기타' },
  { value: 'drum',     label: '드럼' },
  { value: 'bass',     label: '베이스' },
  { value: 'keyboard', label: '키보드' },
  { value: 'other',    label: '기타(other)' },
];

interface ProfileFormProps {
  /** 'setup' — 최초 프로필 설정 페이지 (구형 CSS 스타일)
   *  'edit'  — 프로필 탭 인라인 편집 (다크 테마 스타일) */
  mode: 'setup' | 'edit';
  /** 편집 모드일 때 기존 프로필 데이터 */
  profile?: Profile | null;
  /** 저장 완료 콜백 */
  onSuccess?: () => void;
  /** 편집 모드 취소 버튼 콜백 (edit 모드에서만 사용) */
  onCancel?: () => void;
}

export default function ProfileForm({ mode, profile, onSuccess, onCancel }: ProfileFormProps) {
  const {
    displayName, setDisplayName,
    part, setPart,
    bio, setBio,
    currentAvatar,
    fileInputRef,
    handleFileChange,
    handleSubmit,
    isPending,
    error,
    success,
  } = useProfileForm({
    initialValues: profile
      ? { displayName: profile.display_name, part: profile.part ?? 'guitar', bio: profile.bio ?? '', avatarUrl: profile.avatar_url }
      : undefined,
    onSuccess,
  });

  if (mode === 'setup') {
    return (
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <AvatarUploader
          variant="setup"
          currentAvatar={currentAvatar}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

        <div className="form-group">
          <label>닉네임 *</label>
          <input
            type="text"
            placeholder="동아리에서 쓸 이름"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            required
          />
        </div>

        <div className="form-group">
          <label>담당 파트</label>
          <select value={part} onChange={(e) => setPart(e.target.value as Part)}>
            {PARTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>한줄소개</label>
          <input
            type="text"
            placeholder="간단한 자기소개 (선택)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={60}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="primary-btn"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={isPending}
        >
          {isPending ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
    );
  }

  // mode === 'edit' — 다크 테마 인라인 편집
  return (
    <div className="glass-card p-6 rounded-xl relative overflow-hidden border border-outline-variant/10">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant z-20"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      )}

      <h2 className="text-2xl font-black italic text-on-surface mb-6 mt-2">프로필 수정</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AvatarUploader
          variant="dark"
          currentAvatar={currentAvatar}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

        <div className="form-group">
          <label>닉네임 *</label>
          <input
            type="text"
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            required
          />
        </div>

        <div className="form-group">
          <label>담당 파트</label>
          <select
            value={part}
            onChange={(e) => setPart(e.target.value as Part)}
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors appearance-none"
          >
            {PARTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>한줄소개</label>
          <input
            type="text"
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={60}
          />
        </div>

        {error   && <p className="text-error text-sm font-bold">{error}</p>}
        {success && <p className="text-primary text-sm font-bold">성공적으로 저장되었습니다!</p>}

        <button
          type="submit"
          className="primary-btn w-full mt-4 py-4"
          disabled={isPending}
        >
          {isPending ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </div>
  );
}

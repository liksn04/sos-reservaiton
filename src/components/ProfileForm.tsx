import AvatarUploader from './AvatarUploader';
import { useProfileForm } from '../hooks/useProfileForm';
import type { Part, Profile } from '../types';

const PARTS: { value: Part; label: string }[] = [
  { value: 'vocal',    label: '보컬' },
  { value: 'guitar',   label: '기타' },
  { value: 'drum',     label: '드럼' },
  { value: 'bass',     label: '베이스' },
  { value: 'keyboard', label: '키보드' },
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
    part, togglePart,
    bio, setBio,
    currentAvatar,
    fileInputRef,
    handleFileChange,
    handleSubmit,
    isPending,
    error,
    success,
    // [규칙 4] 동명이인 토글
    showDuplicateToggle,
    allowDuplicateName,
    setAllowDuplicateName,
  } = useProfileForm({
    initialValues: profile
      ? { displayName: profile.display_name, part: profile.part ?? [], bio: profile.bio ?? '', avatarUrl: profile.avatar_url }
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
            placeholder="실명을 입력해주세요."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            required
          />
          {/* [규칙 3] 실명 안내 */}
          <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant, #9ca3af)', marginTop: '4px' }}>
            실명으로 등록하면 동아리원이 쉽게 알아볼 수 있습니다.
          </p>

          {/* [규칙 4] 동명이인 토글 */}
          {showDuplicateToggle && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#ca8a04', fontWeight: 600 }}>
                동명이인이신가요?
              </span>
              <button
                type="button"
                onClick={() => setAllowDuplicateName(!allowDuplicateName)}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: allowDuplicateName ? 'var(--color-primary, #6366f1)' : '#d1d5db',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0,
                }}
                aria-label={allowDuplicateName ? '동명이인 허용 해제' : '동명이인으로 등록 허용'}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: allowDuplicateName ? '21px' : '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left 0.2s ease',
                    display: 'block',
                  }}
                />
              </button>
            </div>
          )}
          {/* 동명이인 허용 안내 */}
          {showDuplicateToggle && allowDuplicateName && (
            <p style={{ fontSize: '11px', color: 'var(--color-primary, #6366f1)', marginTop: '4px', fontWeight: 600 }}>
              동명이인으로 등록됩니다. 저장 버튼을 다시 눌러주세요.
            </p>
          )}
        </div>

        <div className="form-group">
          <label>담당 파트 (중복 선택 가능)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
            {PARTS.map((p) => {
              const isSelected = part.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => (togglePart as any)(p.value)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '1px solid var(--color-primary, #6366f1)' : '1px solid #d1d5db',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: isSelected ? 'var(--color-primary, #6366f1)' : '#6b7280',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
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
          disabled={isPending || (showDuplicateToggle && !allowDuplicateName)}
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
            placeholder="실명을 입력해주세요."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={20}
            required
          />
          {/* [규칙 3] 실명 안내 */}
          <p className="text-[11px] text-on-surface-variant mt-1">
            실명으로 등록하면 동아리원이 쉽게 알아볼 수 있습니다.
          </p>

          {/* [규칙 4] 동명이인 토글 */}
          {showDuplicateToggle && (
            <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              <span className="text-xs font-bold" style={{ color: '#ca8a04' }}>
                동명이인이신가요?
              </span>
              <button
                type="button"
                onClick={() => setAllowDuplicateName(!allowDuplicateName)}
                className="relative flex-shrink-0 transition-colors duration-200 rounded-full border-none cursor-pointer"
                style={{
                  width: '40px',
                  height: '22px',
                  backgroundColor: allowDuplicateName ? 'var(--color-primary)' : '#4b5563',
                }}
                aria-label={allowDuplicateName ? '동명이인 허용 해제' : '동명이인으로 등록 허용'}
              >
                <span
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-200"
                  style={{ left: allowDuplicateName ? '21px' : '3px' }}
                />
              </button>
            </div>
          )}
          {showDuplicateToggle && allowDuplicateName && (
            <p className="text-xs text-primary font-bold mt-1">
              동명이인으로 등록됩니다. 저장 버튼을 다시 눌러주세요.
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="text-sm font-bold text-on-surface-variant mb-2 block">담당 세션 (다중 선택)</label>
          <div className="grid grid-cols-3 gap-2">
            {PARTS.map((p) => {
              const isSelected = part.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => (togglePart as any)(p.value)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    isSelected 
                      ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(204,151,255,0.1)]' 
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
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
          disabled={isPending || (showDuplicateToggle && !allowDuplicateName)}
        >
          {isPending ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </form>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDeleteAccount } from '../hooks/mutations/useDeleteAccount';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountDialog({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return <DeleteAccountDialogContent onClose={onClose} />;
}

function DeleteAccountDialogContent({ onClose }: Pick<Props, 'onClose'>) {
  const { profile, signOut } = useAuth();
  const deleteAccount = useDeleteAccount();

  const [step, setStep] = useState<1 | 2>(1);
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // 2단계로 넘어갈 때 input 포커스
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => confirmInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Escape 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const nameMatches = confirmName.trim() === profile?.display_name?.trim();

  async function handleConfirm() {
    if (!nameMatches) return;
    setError('');
    try {
      // 탈퇴 사유(reason) 필드를 삭제했으므로 undefined 전달
      await deleteAccount.mutateAsync(undefined);
      await signOut();
    } catch (err) {
      console.error(err);
      setError('탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-container animate-slide-up" style={{ maxWidth: 420 }}>

        {/* 헤더 */}
        <div className="modal-header" style={{ paddingBottom: '1rem' }}>
          <h2 className="font-headline text-xl font-bold tracking-tight">
            회원 <span className="text-error">탈퇴</span>
          </h2>
          <button
            className="material-symbols-outlined text-2xl text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            disabled={deleteAccount.isPending}
          >
            close
          </button>
        </div>

        <div className="modal-body space-y-6 !p-6">
          {/* ── STEP 1: 경고 확인 ── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* 경고 박스 */}
              <div 
                className="rounded-2xl p-5 border border-error/20 bg-error/5" 
              >
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-2xl text-error flex-shrink-0">warning</span>
                  <div className="space-y-2">
                    <p className="text-base font-black text-error leading-tight">탈퇴 시 다음 정보가 모두 삭제됩니다</p>
                    <ul className="text-[13px] text-on-surface-variant/80 space-y-1.5 list-none">
                      <li className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-error">chevron_right</span>
                        프로필 정보 및 아바타 이미지
                      </li>
                      <li className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-error">chevron_right</span>
                        내가 등록한 모든 예약
                      </li>
                      <li className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-error">chevron_right</span>
                        합주 초대 내역
                      </li>
                    </ul>
                    <p className="text-[11px] text-error/80 font-black mt-3 flex items-center gap-1 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      이 작업은 되돌릴 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" className="secondary-btn flex-1 py-4" onClick={onClose}>
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="error-btn flex-[1.5] py-4"
                >
                  계속 진행
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: 이름 재확인 ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div 
                className="rounded-2xl p-5 border border-outline-variant/10"
                style={{ backgroundColor: 'var(--surface-container-high)' }}
              >
                <p className="text-sm font-bold text-on-surface-variant leading-relaxed">
                  탈퇴를 확인하려면 아래에 본인의 닉네임{' '}
                  <span className="text-on-surface font-black underline decoration-error/50 underline-offset-4">
                    {profile?.display_name}
                  </span>
                  을(를) 정확히 입력하세요.
                </p>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">닉네임 확인</label>
                <input
                  ref={confirmInputRef}
                  type="text"
                  className="w-full h-[54px] bg-surface-container-low border border-outline-variant/10 rounded-2xl px-4 font-bold text-lg outline-none focus:border-error/50 transition-colors text-on-surface"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={profile?.display_name ?? ''}
                  autoComplete="off"
                />
                {confirmName && !nameMatches && (
                  <p className="text-[11px] text-error mt-2 font-black italic tracking-tight">앗, 닉네임이 일치하지 않아요!</p>
                )}
              </div>

              {error && (
                <div className="text-[11px] p-3 rounded-xl bg-error/10 text-error font-bold border border-error/20">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="secondary-btn flex-1 py-4"
                  onClick={() => setStep(1)}
                  disabled={deleteAccount.isPending}
                >
                  뒤로
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!nameMatches || deleteAccount.isPending}
                  className="error-btn flex-[1.5] py-4 disabled:opacity-30"
                >
                  {deleteAccount.isPending ? '처리 중...' : '탈퇴 확정'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

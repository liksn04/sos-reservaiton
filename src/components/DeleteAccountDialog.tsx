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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return '알 수 없는 오류';
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
  const deletedItems = [
    '프로필 정보 및 아바타 이미지',
    '내가 등록한 모든 예약',
    '합주 초대 내역',
  ];

  async function handleConfirm() {
    if (!nameMatches) return;
    setError('');
    try {
      // 탈퇴 사유(reason) 필드를 삭제했으므로 undefined 전달
      await deleteAccount.mutateAsync(undefined);
      try {
        await signOut();
      } catch (signOutErr) {
        console.warn('Sign out generated an error, but account was logically deleted.', signOutErr);
      }
    } catch (error: unknown) {
      console.error(error);
      setError(`탈퇴 실패: ${getErrorMessage(error)}`);
    }
  }

  return (
    <div
      className="modal-overlay active delete-account-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-container animate-slide-up delete-account-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <div className="delete-account-header">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-error/70">
              irreversible action
            </p>
            <h2 id="delete-account-title" className="font-headline text-xl font-bold tracking-tight text-on-surface">
              회원 <span className="text-error">탈퇴</span>
            </h2>
          </div>
          <button
            type="button"
            aria-label="회원 탈퇴 닫기"
            className="w-10 h-10 rounded-full bg-surface-container-high border border-card-border flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            disabled={deleteAccount.isPending}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="delete-account-body">
          {step === 1 && (
            <div className="space-y-4">
              <div className="delete-account-warning">
                <span className="material-symbols-outlined text-[28px] text-error">warning</span>
                <div className="min-w-0">
                  <p id="delete-account-description" className="text-base font-black text-error leading-tight">
                    탈퇴하면 계정 복구가 불가능합니다.
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-on-surface-variant">
                    아래 데이터가 즉시 삭제되며, 같은 계정으로 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>

              <ul className="delete-account-list">
                {deletedItems.map((item) => (
                  <li key={item} className="delete-account-list-item">
                    <span className="material-symbols-outlined text-[18px] text-error/80">remove_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="delete-account-confirm-copy">
                <p className="text-sm font-bold text-on-surface-variant leading-relaxed">
                  탈퇴를 확인하려면 아래에 본인의 닉네임{' '}
                  <span className="text-on-surface font-black underline decoration-error/50 underline-offset-4">
                    {profile?.display_name}
                  </span>
                  을(를) 정확히 입력하세요.
                </p>
              </div>

              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5 block">
                  닉네임 확인
                </label>
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
                  <p className="text-[11px] text-error mt-2 font-black italic tracking-tight">
                    닉네임이 일치하지 않아요.
                  </p>
                )}
              </div>

              {error && (
                <div className="text-[11px] p-3 rounded-xl bg-error/10 text-error font-bold border border-error/20">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="delete-account-footer">
          {step === 1 ? (
            <>
              <button type="button" className="secondary-btn flex-1" onClick={onClose}>
                취소
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="error-btn flex-[1.2]"
              >
                계속 진행
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary-btn flex-1"
                onClick={() => setStep(1)}
                disabled={deleteAccount.isPending}
              >
                뒤로
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!nameMatches || deleteAccount.isPending}
                className="error-btn flex-[1.2] disabled:opacity-30"
              >
                {deleteAccount.isPending ? '처리 중...' : '탈퇴 확정'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

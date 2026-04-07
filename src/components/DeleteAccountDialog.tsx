import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDeleteAccount } from '../hooks/mutations/useDeleteAccount';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountDialog({ isOpen, onClose }: Props) {
  const { profile, signOut } = useAuth();
  const deleteAccount = useDeleteAccount();

  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setReason('');
    setConfirmName('');
    setError('');
  }, [isOpen]);

  // 2단계로 넘어갈 때 input 포커스
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => confirmInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Escape 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nameMatches = confirmName.trim() === profile?.display_name?.trim();

  async function handleConfirm() {
    if (!nameMatches) return;
    setError('');
    try {
      await deleteAccount.mutateAsync(reason.trim() || undefined);
      // 탈퇴 성공 → 세션 제거 (AuthContext가 SIGNED_OUT 이벤트 감지하여 리다이렉트)
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
      <div className="modal-container" style={{ maxWidth: 420 }}>

        {/* 헤더 */}
        <div className="modal-header">
          <h2 className="text-xl font-black italic tracking-tighter">
            회원 <span className="text-error">탈퇴</span>
          </h2>
          <button
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            style={{ fontSize: '24px' }}
            disabled={deleteAccount.isPending}
          >
            close
          </button>
        </div>

        {/* ── STEP 1: 경고 + 사유 입력 ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* 경고 박스 */}
            <div className="rounded-xl p-4 border border-error/30 bg-error/5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5">warning</span>
                <div className="space-y-1.5">
                  <p className="text-sm font-black text-error">탈퇴 시 다음 정보가 모두 삭제됩니다</p>
                  <ul className="text-xs text-on-surface-variant space-y-0.5 list-none">
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-error/60">chevron_right</span>
                      프로필 정보 및 아바타 이미지
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-error/60">chevron_right</span>
                      내가 등록한 모든 예약
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-error/60">chevron_right</span>
                      합주 초대 내역
                    </li>
                  </ul>
                  <p className="text-xs text-error/70 font-bold mt-2">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </div>
            </div>

            {/* 사유 입력 (선택) */}
            <div className="form-group">
              <label>탈퇴 사유 <span className="text-on-surface-variant text-xs font-normal">(선택)</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="탈퇴하시는 이유를 알려주시면 서비스 개선에 도움이 됩니다."
                rows={3}
                maxLength={300}
                style={{ resize: 'none' }}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                취소
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl font-black text-sm bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-colors"
              >
                계속 진행
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: 이름 재확인 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 border border-outline-variant/20 bg-surface-container">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                탈퇴를 확인하려면 아래에 본인의 닉네임{' '}
                <span className="text-on-surface font-black">
                  {profile?.display_name}
                </span>
                을(를) 정확히 입력하세요.
              </p>
            </div>

            <div className="form-group">
              <label>닉네임 입력</label>
              <input
                ref={confirmInputRef}
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={profile?.display_name ?? ''}
                autoComplete="off"
              />
              {confirmName && !nameMatches && (
                <p className="text-xs text-error mt-1.5 font-bold">닉네임이 일치하지 않습니다.</p>
              )}
            </div>

            {error && (
              <p className="text-xs text-error font-bold">{error}</p>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep(1)}
                disabled={deleteAccount.isPending}
              >
                뒤로
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!nameMatches || deleteAccount.isPending}
                className="px-6 py-3 rounded-xl font-black text-sm transition-colors border"
                style={{
                  background: nameMatches && !deleteAccount.isPending ? 'rgb(var(--error-rgb, 179 38 30) / 0.15)' : undefined,
                  color: nameMatches && !deleteAccount.isPending ? 'var(--error, #b3261e)' : undefined,
                  borderColor: nameMatches && !deleteAccount.isPending ? 'rgb(var(--error-rgb, 179 38 30) / 0.4)' : undefined,
                  opacity: (!nameMatches || deleteAccount.isPending) ? 0.4 : 1,
                  cursor: (!nameMatches || deleteAccount.isPending) ? 'not-allowed' : 'pointer',
                }}
              >
                {deleteAccount.isPending ? '탈퇴 처리 중...' : '탈퇴 확정'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  userName: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

export default function BanDialog({ isOpen, userName, onConfirm, onClose, isPending }: Props) {
  if (!isOpen) return null;

  return (
    <BanDialogContent
      userName={userName}
      onConfirm={onConfirm}
      onClose={onClose}
      isPending={isPending}
    />
  );
}

function BanDialogContent({ userName, onConfirm, onClose, isPending }: Omit<Props, 'isOpen'>) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-container" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="font-headline text-xl font-bold tracking-tight">
            회원 <span className="text-error">차단</span>
          </h2>
          <button
            className="material-symbols-outlined text-2xl text-on-surface-variant"
            onClick={onClose}
            disabled={isPending}
          >
            close
          </button>
        </div>

        <div className="rounded-xl p-4 border border-outline-variant/20 bg-surface-container mb-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <span className="text-on-surface font-black">{userName}</span> 님을 차단합니다.
            차단된 회원은 앱에 접근할 수 없습니다.
          </p>
        </div>

        <div className="form-group">
          <label>차단 사유 <span className="text-on-surface-variant text-xs font-normal">(선택)</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="차단 사유를 입력하면 관리 로그에 기록됩니다."
            rows={3}
            maxLength={200}
            style={{ resize: 'none' }}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isPending}>
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending}
            className="error-btn flex-[2] flex items-center justify-center gap-2"
          >
            {isPending
              ? <div className="w-4 h-4 border-2 border-error/20 border-t-error rounded-full animate-spin" />
              : <>
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  차단 확정
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

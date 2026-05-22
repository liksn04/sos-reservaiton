import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmContext, type ConfirmOptions } from './confirm-context';

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    current.resolve(value);
    setPending(null);
  }, []);

  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') settle(false);
      else if (e.key === 'Enter') settle(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="modal-overlay active"
          onClick={(e) => { if (e.target === e.currentTarget) settle(false); }}
          style={{ padding: '70px 1rem 90px' }}
        >
          <div
            className="modal-container animate-slide-up"
            style={{ maxWidth: 420 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="modal-header" style={{ paddingTop: '2.25rem' }}>
              <h2 id="confirm-dialog-title" className="font-headline text-xl font-bold tracking-tight">
                {pending.title}
              </h2>
            </div>

            {pending.description && (
              <div className="modal-body">
                <p className="text-sm font-medium text-on-surface-variant whitespace-pre-line">
                  {pending.description}
                </p>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn flex-1 py-3"
                onClick={() => settle(false)}
              >
                {pending.cancelLabel ?? '취소'}
              </button>
              <button
                type="button"
                className={`flex-[2] py-3 ${pending.destructive ? 'secondary-btn !text-error !border-error/40' : 'primary-btn'}`}
                onClick={() => settle(true)}
                autoFocus
              >
                {pending.confirmLabel ?? '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

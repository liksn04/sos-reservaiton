import React from 'react';
import { useToastInternal } from '../../contexts/useToast';
import { ToastItem } from './ToastItem';
import { createPortal } from 'react-dom';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastInternal();

  // We use a portal to ensure toasts are always on top and outside the main scroll
  // But wait, since we're in a single-page app with a shell, we can just render it here.
  // Actually, putting it in App.tsx is better.

  return createPortal(
    <div className="toast-container-wrapper">
      <div className="toast-stack">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration || 3000}
            onRemove={removeToast}
          />
        ))}
      </div>

      <style>{`
        .toast-container-wrapper {
          position: fixed;
          bottom: 100px; /* Navigation bar height + padding */
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          pointer-events: none;
          width: 100%;
          max-width: 500px;
          display: flex;
          justify-content: center;
        }

        .toast-stack {
          display: flex;
          flex-direction: column-reverse; /* New toasts push old ones up */
          align-items: center;
          width: 100%;
          padding: 0 1.25rem;
          pointer-events: auto;
        }

        @media (max-width: 640px) {
          .toast-container-wrapper {
            bottom: 90px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

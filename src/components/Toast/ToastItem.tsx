import React, { useEffect, useState } from 'react';
import type { ToastType } from '../../types/toast';

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  onRemove: (id: string) => void;
}

const TYPE_CONFIG = {
  success: {
    icon: 'check_circle',
    color: 'var(--success)',
    bg: 'rgba(74, 222, 128, 0.1)',
  },
  error: {
    icon: 'error',
    color: 'var(--error)',
    bg: 'rgba(255, 69, 58, 0.1)',
  },
  warning: {
    icon: 'warning',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  info: {
    icon: 'info',
    color: 'var(--primary)',
    bg: 'rgba(168, 85, 247, 0.1)',
  },
};

export const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, duration, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, duration - 300); // Start exit animation slightly before removal

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={`toast-item ${isExiting ? 'exit' : 'enter'}`}
      style={{
        backgroundColor: 'var(--surface-container-high)',
        border: `1px solid ${config.color}30`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={handleClose}
    >
      <div className="toast-content">
        <span 
          className="material-symbols-outlined toast-icon"
          style={{ color: config.color, fontVariationSettings: "'FILL' 1" }}
        >
          {config.icon}
        </span>
        <p className="toast-message">{message}</p>
        <button className="toast-close" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      {duration > 0 && (
        <div 
          className="toast-progress-bar"
          style={{ 
            backgroundColor: config.color,
            animationDuration: `${duration}ms`
          }}
        />
      )}

      <style>{`
        .toast-item {
          position: relative;
          min-width: 300px;
          max-width: 90vw;
          padding: 1rem 1.25rem;
          border-radius: 1.25rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          margin-bottom: 0.75rem;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          user-select: none;
        }

        .toast-item.enter {
          animation: toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-item.exit {
          animation: toast-exit 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes toast-exit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(10px) scale(0.9); }
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          z-index: 1;
        }

        .toast-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.4;
          margin: 0;
        }

        .toast-close {
          opacity: 0.5;
          transition: opacity 0.2s;
          color: var(--text-muted);
          padding: 4px;
        }

        .toast-item:hover .toast-close {
          opacity: 1;
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          opacity: 0.4;
          border-radius: 0 2px 2px 0;
          animation: toast-progress linear forwards;
        }

        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        /* Light Theme Adjustments */
        html.light .toast-item {
          box-shadow: 0 8px 24px rgba(25, 118, 210, 0.15);
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

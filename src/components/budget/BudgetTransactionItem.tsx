import { memo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { BudgetTransaction } from '../../types';

interface Props {
  transaction: BudgetTransaction;
  isAdmin: boolean;
  isDeleting: boolean;
  onEdit: (tx: BudgetTransaction) => void;
  onDelete: (tx: BudgetTransaction) => void;
}

function BudgetTransactionItemComponent({ transaction: t, isAdmin, isDeleting, onEdit, onDelete }: Props) {
  return (
    <div className="p-6 hover:bg-white/60 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center border border-card-border group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined" style={{ color: t.category?.color ?? '#6b7280' }}>
              {t.category?.icon ?? (t.type === 'income' ? 'add_circle' : 'remove_circle')}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black">{t.description}</span>
              {t.category && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter"
                  style={{ backgroundColor: `${t.category.color}20`, color: t.category.color }}
                >
                  {t.category.name}
                </span>
              )}
              {t.receipt_url && (
                <a
                  href={t.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="material-symbols-outlined text-xs align-middle">receipt</span>
                </a>
              )}
            </div>
            <p className="text-[10px] font-bold opacity-40">
              {format(new Date(t.transaction_date), 'yyyy.MM.dd', { locale: ko })}
              {t.bank_account && <span className="ml-2">· {t.bank_account}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()}원
          </p>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(t)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(t)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-error/10 text-error transition-colors"
                disabled={isDeleting}
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const BudgetTransactionItem = memo(BudgetTransactionItemComponent);

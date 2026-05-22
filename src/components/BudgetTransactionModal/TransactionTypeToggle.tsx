import type { BudgetTransaction } from '../../types';

type TransactionType = BudgetTransaction['type'];

interface TransactionTypeToggleProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

export function TransactionTypeToggle({ value, onChange }: TransactionTypeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-card-border bg-surface-container-low">
      {(['income', 'expense'] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            value === type
              ? type === 'income'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'opacity-40 hover:opacity-80'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {type === 'income' ? 'add_circle' : 'remove_circle'}
          </span>
          {type === 'income' ? '수입' : '지출'}
        </button>
      ))}
    </div>
  );
}

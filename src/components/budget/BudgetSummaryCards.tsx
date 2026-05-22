import { memo } from 'react';
import { formatCurrency } from '../../utils/format';

interface Props {
  income: number;
  expense: number;
  balance: number;
}

function BudgetSummaryCardsComponent({ income, expense, balance }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
      <div className="surface-card p-6 relative overflow-hidden group">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-emerald-500">add_circle</span>
        </div>
        <div className="space-y-1">
          <p className="font-headline text-[2rem] font-bold text-on-surface leading-tight tracking-tight">
            {formatCurrency(income)}
          </p>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
            이번 학기 총 수입
          </p>
        </div>
      </div>

      <div className="surface-card p-6 relative overflow-hidden group">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-rose-500">remove_circle</span>
        </div>
        <div className="space-y-1">
          <p className="font-headline text-[2rem] font-bold text-on-surface leading-tight tracking-tight">
            {formatCurrency(expense)}
          </p>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
            이번 학기 총 지출
          </p>
        </div>
      </div>

      <div
        className="col-span-2 md:col-span-1 p-6 rounded-[2rem] relative overflow-hidden group text-white"
        style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
      >
        <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white">account_balance_wallet</span>
        </div>
        <div className="space-y-1">
          <p className="font-headline text-[2rem] font-bold text-white leading-tight tracking-tight">
            {formatCurrency(balance)}
          </p>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
            현재 재정 잔액
          </p>
        </div>
      </div>
    </div>
  );
}

export const BudgetSummaryCards = memo(BudgetSummaryCardsComponent);

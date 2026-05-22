import type { BudgetTransaction } from '../../types';
import { BudgetTransactionItem } from './BudgetTransactionItem';

interface Props {
  transactions: BudgetTransaction[] | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  isDeleting: boolean;
  onOpenCreate: () => void;
  onEdit: (tx: BudgetTransaction) => void;
  onDelete: (tx: BudgetTransaction) => void;
}

export function BudgetTransactionList({
  transactions,
  isLoading,
  isAdmin,
  isDeleting,
  onOpenCreate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="page-section-card overflow-hidden">
      <div className="p-8 border-b border-card-border flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          거래 내역
        </h3>
        {isAdmin && (
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all bg-primary-btn text-white shadow-lg shadow-primary/25"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            내역 추가
          </button>
        )}
      </div>

      <div className="divide-y divide-card-border">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center opacity-30">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">account_balance_wallet</span>
            <p className="font-headline text-sm font-bold">표시할 거래 내역이 없습니다.</p>
          </div>
        ) : (
          transactions.map((t) => (
            <BudgetTransactionItem
              key={t.id}
              transaction={t}
              isAdmin={isAdmin}
              isDeleting={isDeleting}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

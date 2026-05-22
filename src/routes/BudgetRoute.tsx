import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudgetTransactions } from '../hooks/useBudgetTransactions';
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations';
import { useAuth } from '../context/AuthContext';
import BudgetTransactionModal from '../components/BudgetTransactionModal';
import MembershipFeePanel from '../components/MembershipFeePanel';
import YearArchiveSelector from '../components/YearArchiveSelector';
import { BudgetSummaryCards } from '../components/budget/BudgetSummaryCards';
import { BudgetTransactionList } from '../components/budget/BudgetTransactionList';
import { routeModuleLoaders, scheduleIdlePrefetch, shouldPrefetchHeavyRoute } from '../lib/moduleLoaders';
import { useConfirm } from '../contexts/useConfirm';
import { useToast } from '../contexts/useToast';
import type { BudgetTransaction } from '../types';

type Tab = 'transactions' | 'charts' | 'fees';
type FilterHalf = 1 | 2;

const BudgetCharts = lazy(routeModuleLoaders.budgetCharts);

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'transactions', label: '거래 내역', icon: 'list_alt' },
  { id: 'charts', label: '통계 리포트', icon: 'analytics' },
  { id: 'fees', label: '회비 관리', icon: 'payments' },
];

function BudgetChartsFallback() {
  return (
    <div className="surface-card p-10 flex flex-col items-center justify-center text-center">
      <div className="mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="font-headline text-lg font-bold tracking-tight text-on-surface">통계 리포트를 준비하고 있습니다</p>
      <p className="mt-2 text-sm text-on-surface-variant">차트 라이브러리를 필요할 때만 로드하도록 분리했습니다.</p>
    </div>
  );
}

function getInitialHalf(): FilterHalf {
  return new Date().getMonth() + 1 <= 6 ? 1 : 2;
}

function computeSummary(transactions: BudgetTransaction[] | undefined) {
  if (!transactions) return { income: 0, expense: 0, balance: 0 };
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const value = Number(t.amount);
    if (t.type === 'income') income += value;
    else expense += value;
  }
  return { income, expense, balance: income - expense };
}

export default function BudgetRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [fiscalYear, setFiscalYear] = useState(() => new Date().getFullYear());
  const [fiscalHalf, setFiscalHalf] = useState<FilterHalf>(getInitialHalf);
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<BudgetTransaction | null>(null);

  const { deleteTransaction } = useBudgetMutations();
  const { data: transactions, isLoading } = useBudgetTransactions(fiscalYear, fiscalHalf);
  const confirm = useConfirm();
  const { addToast } = useToast();

  const isAdmin = profile?.is_admin ?? false;

  useEffect(() => {
    if (activeTab === 'charts') return undefined;
    return scheduleIdlePrefetch(() => {
      if (shouldPrefetchHeavyRoute()) {
        void routeModuleLoaders.budgetCharts();
      }
    }, 1200);
  }, [activeTab]);

  const summary = useMemo(() => computeSummary(transactions), [transactions]);

  const openCreate = useCallback(() => {
    setEditingTx(null);
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((tx: BudgetTransaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (tx: BudgetTransaction) => {
    const ok = await confirm({
      title: '거래 내역 삭제',
      description: `'${tx.description}' 내역을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteTransaction.mutateAsync(tx.id);
    } catch {
      addToast('시스템 오류로 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  }, [deleteTransaction, confirm, addToast]);

  return (
    <div className="app-shell pb-20">
      <header className="top-app-bar">
        <div className="logo-area">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-lowest border border-card-border hover:bg-surface-container-high transition-colors text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <span className="logo-text ml-2">재정 관리</span>
        </div>
      </header>

      <main className="shell-main">
        <div className="animate-slide-up">
          <div className="club-tag tracking-wider mb-2">재정 대시보드</div>
          <h1 className="dashboard-title mb-8">
            <span className="text-gradient-white-purple">{`${fiscalYear}년 ${fiscalHalf}학기 재정`}</span>
          </h1>

          <YearArchiveSelector selectedYear={fiscalYear} onYearChange={setFiscalYear} />

          <div className="segmented-control mb-8 w-fit">
            {[1, 2].map((half) => (
              <button
                key={half}
                onClick={() => setFiscalHalf(half as FilterHalf)}
                className={`segmented-option ${fiscalHalf === half ? 'active' : ''}`}
              >
                {half === 1 ? '1학기' : '2학기'}
              </button>
            ))}
          </div>

          <BudgetSummaryCards income={summary.income} expense={summary.expense} balance={summary.balance} />

          <div className="segmented-control mb-8 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`segmented-option ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            {activeTab === 'transactions' && (
              <div className="animate-fade-in-up">
                <BudgetTransactionList
                  transactions={transactions}
                  isLoading={isLoading}
                  isAdmin={isAdmin}
                  isDeleting={deleteTransaction.isPending}
                  onOpenCreate={openCreate}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}

            {activeTab === 'charts' && (
              <Suspense fallback={<BudgetChartsFallback />}>
                <BudgetCharts transactions={transactions || []} />
              </Suspense>
            )}

            {activeTab === 'fees' && (
              <MembershipFeePanel year={fiscalYear} half={fiscalHalf} />
            )}
          </div>
        </div>
      </main>

      <BudgetTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editing={editingTx}
        fiscalYear={fiscalYear}
        fiscalHalf={fiscalHalf}
      />
    </div>
  );
}

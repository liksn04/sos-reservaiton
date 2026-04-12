import { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBudgetTransactions } from '../hooks/useBudgetTransactions';
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations';
import { useAuth } from '../context/AuthContext';
import BudgetTransactionModal from '../components/BudgetTransactionModal';
import MembershipFeePanel from '../components/MembershipFeePanel';
import YearArchiveSelector from '../components/YearArchiveSelector';
import { routeModuleLoaders, scheduleIdlePrefetch } from '../lib/moduleLoaders';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/format';
import { ko } from 'date-fns/locale';
import type { BudgetTransaction } from '../types';

type Tab = 'transactions' | 'charts' | 'fees';
type FilterHalf = 1 | 2;

const BudgetCharts = lazy(routeModuleLoaders.budgetCharts);

function BudgetChartsFallback() {
  return (
    <div className="surface-card p-10 flex flex-col items-center justify-center text-center">
      <div className="mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="font-headline text-lg font-bold tracking-tight text-on-surface">통계 리포트를 준비하고 있습니다</p>
      <p className="mt-2 text-sm text-on-surface-variant">차트 라이브러리를 필요할 때만 로드하도록 분리했습니다.</p>
    </div>
  );
}

export default function BudgetRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const initialHalf = currentMonth <= 6 ? 1 : 2;

  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [fiscalHalf, setFiscalHalf] = useState<FilterHalf>(initialHalf as FilterHalf);
  const [activeTab, setActiveTab] = useState<Tab>('transactions');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<BudgetTransaction | null>(null);

  const { deleteTransaction } = useBudgetMutations();

  const { data: transactions, isLoading } = useBudgetTransactions(fiscalYear, fiscalHalf);

  const isAdmin = profile?.is_admin ?? false;

  useEffect(() => {
    if (activeTab === 'charts') {
      return undefined;
    }

    return scheduleIdlePrefetch(() => {
      void routeModuleLoaders.budgetCharts();
    }, 600);
  }, [activeTab]);

  // 요약 산출
  const summary = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, balance: 0 };
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  function openCreate() {
    setEditingTx(null);
    setIsModalOpen(true);
  }

  function openEdit(tx: BudgetTransaction) {
    setEditingTx(tx);
    setIsModalOpen(true);
  }

  async function handleDelete(tx: BudgetTransaction) {
    if (!confirm(`'${tx.description}' 내역을 삭제하시겠습니까?`)) return;
    try {
      await deleteTransaction.mutateAsync(tx.id);
    } catch {
      alert('시스템 오류로 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

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
          <span className="logo-text ml-2">예산 관리</span>
        </div>
      </header>

      <main className="shell-main">
        <div className="animate-slide-up">
          <div className="club-tag tracking-wider mb-2">재정 대시보드</div>
          <h1 className="dashboard-title mb-8">
            <span className="text-gradient-white-purple">{`${fiscalYear}년 ${fiscalHalf}학기 예산`}</span>
          </h1>

          {/* ── 연도 아카이브 셀렉터 ── */}
          <YearArchiveSelector selectedYear={fiscalYear} onYearChange={setFiscalYear} />

          {/* ── 학기 필터 섹션 ── */}
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

          {/* ── 요약 카드 ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {/* 수입 카드 */}
            <div className="surface-card p-6 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-emerald-500">add_circle</span>
              </div>
              <div className="space-y-1">
                <p className="font-headline text-[2rem] font-bold text-on-surface leading-tight tracking-tight">
                  {formatCurrency(summary.income)}
                </p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                  이번 학기 총 수입
                </p>
              </div>
            </div>

            {/* 지출 카드 */}
            <div className="surface-card p-6 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-rose-500">remove_circle</span>
              </div>
              <div className="space-y-1">
                <p className="font-headline text-[2rem] font-bold text-on-surface leading-tight tracking-tight">
                  {formatCurrency(summary.expense)}
                </p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                  이번 학기 총 지출
                </p>
              </div>
            </div>

            {/* 잔액 카드 (Full Width on Mobile) */}
            <div
              className="col-span-2 md:col-span-1 p-6 rounded-[2rem] relative overflow-hidden group text-white"
              style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white">account_balance_wallet</span>
              </div>
              <div className="space-y-1">
                <p className="font-headline text-[2rem] font-bold text-white leading-tight tracking-tight">
                  {formatCurrency(summary.balance)}
                </p>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  현재 예산 잔액
                </p>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="segmented-control mb-8 w-fit">
            {[
              { id: 'transactions', label: '거래 내역', icon: 'list_alt' },
              { id: 'charts', label: '통계 리포트', icon: 'analytics' },
              { id: 'fees', label: '회비 관리', icon: 'payments' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
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
                <div className="page-section-card overflow-hidden">
                  <div className="p-8 border-b border-card-border flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">history</span>
                      거래 내역
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={openCreate}
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
                    ) : transactions?.length === 0 ? (
                      <div className="p-20 flex flex-col items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-6xl mb-4">account_balance_wallet</span>
                        <p className="font-headline text-sm font-bold">표시할 거래 내역이 없습니다.</p>
                      </div>
                    ) : (
                      transactions?.map((t) => (
                        <div key={t.id} className="p-6 hover:bg-white/60 transition-colors group">
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
                                    onClick={() => openEdit(t)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(t)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-error/10 text-error transition-colors"
                                    disabled={deleteTransaction.isPending}
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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

      {/* 거래 등록/수정 모달 */}
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

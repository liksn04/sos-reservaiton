import { useCallback, useMemo, useState } from 'react';
import { useMembershipFees } from '../hooks/useMembershipFees';
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations';
import { useToast } from '../contexts/useToast';
import { formatCurrency } from '../utils/format';
import { MembershipFeePolicyCard } from './budget/MembershipFeePolicyCard';
import { MemberPaymentCard } from './budget/MemberPaymentCard';
import type { MembershipFeeMemberStatus } from '../types';

interface Props {
  year: number;
  half: 1 | 2;
}

function normalize(value: string): string {
  return value.toLowerCase();
}

export default function MembershipFeePanel({ year, half }: Props) {
  const { policy, records, isLoading } = useMembershipFees(year, half);
  const { markMembershipPaid } = useBudgetMutations();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedSearch = useMemo(() => normalize(searchTerm.trim()), [searchTerm]);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!normalizedSearch) return records;
    return records.filter((r) => normalize(r.displayName).includes(normalizedSearch));
  }, [records, normalizedSearch]);

  const { paidCount, totalCount, totalAmount, progress } = useMemo(() => {
    const all = records ?? [];
    const paid = all.reduce((sum, r) => sum + (r.isPaid ? 1 : 0), 0);
    const total = all.length;
    const amount = paid * (policy?.amount ?? 0);
    return {
      paidCount: paid,
      totalCount: total,
      totalAmount: amount,
      progress: total > 0 ? (paid / total) * 100 : 0,
    };
  }, [records, policy?.amount]);

  const isPolicyConfigured = Boolean(policy?.id);
  const isPending = markMembershipPaid.isPending;

  const handleToggle = useCallback(async (record: MembershipFeeMemberStatus) => {
    if (!record.policyId) {
      addToast('회비 정책을 먼저 저장해주세요.', 'error');
      return;
    }
    const nextPaidStatus = !record.isPaid;
    try {
      await markMembershipPaid.mutateAsync({
        userId: record.userId,
        policyId: record.policyId,
        isPaid: nextPaidStatus,
      });
      addToast(
        nextPaidStatus
          ? `${record.displayName}님의 회비 납부가 확인되었습니다.`
          : `${record.displayName}님의 회비 납부가 취소되었습니다.`,
        'success',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.';
      addToast(msg, 'error');
    }
  }, [markMembershipPaid, addToast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">회비 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MembershipFeePolicyCard
          key={`${year}-${half}-${policy?.id ?? 'new'}-${policy?.amount ?? 0}-${policy?.due_date ?? ''}-${policy?.note ?? ''}`}
          year={year}
          half={half}
          policy={policy}
        />

        <div className="surface-card p-6 relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                </div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                  납부 현황 ({paidCount}/{totalCount})
                </p>
              </div>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                {progress.toFixed(0)}%
              </span>
            </div>

            <div className="space-y-3">
              <div className="h-1.5 bg-on-surface/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-2xl font-black text-on-surface leading-tight">
                {formatCurrency(totalAmount)}
                <span className="text-xs font-bold text-on-surface-variant opacity-40 ml-2">수납 완료</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-section-card p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-on-surface/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm opacity-60">group</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">회비 납부 명단</h3>
          </div>

          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-30 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-11 pr-5 py-2.5 rounded-2xl bg-on-surface/5 border border-transparent text-xs font-bold outline-none focus:border-primary/30 focus:bg-on-surface/[0.08] transition-all"
            />
          </div>
        </div>

        {!isPolicyConfigured && (
          <div className="mb-6 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.04] px-5 py-4">
            <p className="text-xs font-black text-primary">회비 정책이 아직 저장되지 않았습니다.</p>
            <p className="mt-1 text-[11px] font-bold text-on-surface-variant">
              위 정책 카드에서 금액을 저장하면 회원별 납부 토글이 활성화됩니다.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRecords.map((record) => (
            <MemberPaymentCard
              key={record.userId}
              record={record}
              isPending={isPending}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center opacity-20">
            <span className="material-symbols-outlined text-5xl mb-3">person_search</span>
            <p className="text-xs font-bold tracking-widest uppercase">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

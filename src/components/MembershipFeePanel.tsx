import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMembershipFees } from '../hooks/useMembershipFees';
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations';
import { useToast } from '../contexts/useToast';
import { formatCurrency } from '../utils/format';
import {
  sanitizeMembershipFeePolicyDraft,
  validateMembershipFeePolicyDraft,
} from '../utils/membershipFees';
import type { MembershipFeePolicy } from '../types';

interface Props {
  year: number;
  half: 1 | 2;
}

export default function MembershipFeePanel({ year, half }: Props) {
  const { policy, records, isLoading } = useMembershipFees(year, half);
  const { markMembershipPaid } = useBudgetMutations();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">회비 데이터를 불러오는 중...</p>
      </div>
    );
  }

  const filteredRecords = records?.filter((r) =>
    r.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paidCount = records?.filter((r) => r.isPaid).length ?? 0;
  const totalCount = records?.length ?? 0;
  const totalAmount = paidCount * (policy?.amount ?? 0);
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const isPolicyConfigured = Boolean(policy?.id);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── 학기 요약 및 정책 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MembershipFeePolicyCard
          key={`${year}-${half}-${policy?.id ?? 'new'}-${policy?.amount ?? 0}-${policy?.due_date ?? ''}-${policy?.note ?? ''}`}
          year={year}
          half={half}
          policy={policy}
        />

        {/* 납부 현황 카드 */}
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

      {/* ── 명단 리스트 ── */}
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
          {filteredRecords?.map((record) => (
            <div
              key={record.userId}
              className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                record.isPaid
                  ? 'bg-primary/[0.03] border-primary/10'
                  : 'bg-on-surface/[0.02] border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
              }`}
            >
              <div className="min-w-0">
                <span className="text-xs font-black truncate block">{record.displayName}</span>
                {record.isPaid && record.paidAt && (
                  <p className="text-[9px] font-bold opacity-30">
                    {format(new Date(record.paidAt), 'MM.dd HH:mm', { locale: ko })}
                  </p>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    if (!record.policyId) {
                      addToast('회비 정책을 먼저 저장해주세요.', 'error');
                      return;
                    }

                    const nextPaidStatus = !record.isPaid;
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
                }}
                disabled={markMembershipPaid.isPending || !record.policyId}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  record.isPaid
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-on-surface/10 text-on-surface opacity-30 hover:opacity-100 hover:bg-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-20'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-black">
                  {record.isPaid ? 'check' : 'close'}
                </span>
              </button>
            </div>
          ))}
        </div>

        {filteredRecords?.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center opacity-20">
            <span className="material-symbols-outlined text-5xl mb-3">person_search</span>
            <p className="text-xs font-bold tracking-widest uppercase">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MembershipFeePolicyCard({
  year,
  half,
  policy,
}: {
  year: number;
  half: 1 | 2;
  policy: MembershipFeePolicy | null;
}) {
  const { upsertMembershipPolicy } = useBudgetMutations();
  const { addToast } = useToast();
  const [policyDraft, setPolicyDraft] = useState({
    amountText: policy?.amount ? String(policy.amount) : '',
    dueDate: policy?.due_date ?? '',
    note: policy?.note ?? '',
  });

  async function handlePolicySave() {
    const validationMessage = validateMembershipFeePolicyDraft(policyDraft);
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    try {
      await upsertMembershipPolicy.mutateAsync({
        year,
        half,
        input: sanitizeMembershipFeePolicyDraft(policyDraft),
      });
      addToast('회비 정책을 저장했습니다.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : '회비 정책 저장에 실패했습니다.';
      addToast(message, 'error');
    }
  }

  return (
    <div className="surface-card p-6 relative overflow-hidden group space-y-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
            {year}년 {half}학기 회비 정책
          </p>
        </div>

        {policy ? (
          <div className="space-y-1 mb-5">
            <p className="text-2xl font-black text-on-surface leading-tight">
              {formatCurrency(policy.amount)}
            </p>
            <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">
              마감: {policy.due_date ? format(new Date(policy.due_date), 'yyyy.MM.dd', { locale: ko }) : '미지정'}
            </p>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <p className="text-xs font-black text-amber-700">정책 생성 필요</p>
            <p className="mt-1 text-[11px] font-bold text-amber-700/80">
              회비 금액과 마감일을 먼저 저장하면 납부 토글이 활성화됩니다.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              회비 금액
            </label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={policyDraft.amountText}
              onChange={(event) => setPolicyDraft((prev) => ({ ...prev, amountText: event.target.value }))}
              className="w-full rounded-2xl border border-card-border bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary/40"
              placeholder="예: 30000"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              마감일
            </label>
            <input
              type="date"
              value={policyDraft.dueDate}
              onChange={(event) => setPolicyDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="w-full rounded-2xl border border-card-border bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              메모
            </label>
            <textarea
              value={policyDraft.note}
              onChange={(event) => setPolicyDraft((prev) => ({ ...prev, note: event.target.value }))}
              className="min-h-[92px] w-full rounded-2xl border border-card-border bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary/40"
              placeholder="예: 상반기 정회원 회비"
              maxLength={200}
            />
          </div>

          <button
            type="button"
            onClick={handlePolicySave}
            disabled={upsertMembershipPolicy.isPending}
            className="w-full rounded-full bg-primary-btn px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upsertMembershipPolicy.isPending ? '저장 중...' : policy ? '회비 정책 수정' : '회비 정책 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}

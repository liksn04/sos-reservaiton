import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useBudgetMutations } from '../../hooks/mutations/useBudgetMutations';
import { useToast } from '../../contexts/useToast';
import { formatCurrency } from '../../utils/format';
import {
  sanitizeMembershipFeePolicyDraft,
  validateMembershipFeePolicyDraft,
} from '../../utils/membershipFees';
import type { MembershipFeePolicy } from '../../types';

interface Props {
  year: number;
  half: 1 | 2;
  policy: MembershipFeePolicy | null;
}

interface PolicyDraft {
  amountText: string;
  dueDate: string;
  note: string;
}

function buildDraft(policy: MembershipFeePolicy | null): PolicyDraft {
  return {
    amountText: policy?.amount ? String(policy.amount) : '',
    dueDate: policy?.due_date ?? '',
    note: policy?.note ?? '',
  };
}

export function MembershipFeePolicyCard({ year, half, policy }: Props) {
  const { upsertMembershipPolicy } = useBudgetMutations();
  const { addToast } = useToast();
  const [draft, setDraft] = useState<PolicyDraft>(() => buildDraft(policy));

  async function handleSave() {
    const validationMessage = validateMembershipFeePolicyDraft(draft);
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    try {
      await upsertMembershipPolicy.mutateAsync({
        year,
        half,
        input: sanitizeMembershipFeePolicyDraft(draft),
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
              value={draft.amountText}
              onChange={(event) => setDraft((prev) => ({ ...prev, amountText: event.target.value }))}
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
              value={draft.dueDate}
              onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="w-full rounded-2xl border border-card-border bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              메모
            </label>
            <textarea
              value={draft.note}
              onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
              className="min-h-[92px] w-full rounded-2xl border border-card-border bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface outline-none transition-colors focus:border-primary/40"
              placeholder="예: 상반기 정회원 회비"
              maxLength={200}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
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

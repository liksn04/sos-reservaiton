import { memo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { MembershipFeeMemberStatus } from '../../types';

interface Props {
  record: MembershipFeeMemberStatus;
  isPending: boolean;
  onToggle: (record: MembershipFeeMemberStatus) => void;
}

function MemberPaymentCardComponent({ record, isPending, onToggle }: Props) {
  return (
    <div
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
        onClick={() => onToggle(record)}
        disabled={isPending || !record.policyId}
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
  );
}

export const MemberPaymentCard = memo(MemberPaymentCardComponent);

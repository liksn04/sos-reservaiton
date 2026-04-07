import { useState } from 'react'
import { useMembershipFees } from '../hooks/useMembershipFees'
import { useBudgetMutations } from '../hooks/mutations/useBudgetMutations'
import { useToast } from '../contexts/ToastContext'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatCurrency } from '../utils/format'

interface Props {
  year: number
  half: number
}

export default function MembershipFeePanel({ year, half }: Props) {
  const { policy, records, isLoading } = useMembershipFees(year, half)
  const { markMembershipPaid } = useBudgetMutations()
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">회비 데이터를 불러오는 중...</p>
      </div>
    )
  }

  const filteredRecords = records?.filter((r) =>
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paidCount = records?.filter((r) => r.is_paid).length ?? 0
  const totalCount = records?.length ?? 0
  const totalAmount = paidCount * (policy?.amount ?? 0)
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── 학기 요약 및 정책 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 정책 카드 */}
        <div className="bg-surface-container-low border border-card-border p-6 rounded-[2.5rem] relative overflow-hidden group">
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
              <div className="space-y-1">
                <p className="text-2xl font-black text-on-surface leading-tight">
                  {formatCurrency(policy.amount)}
                </p>
                <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">
                  마감: {policy.due_date ? format(new Date(policy.due_date), 'yyyy.MM.dd', { locale: ko }) : '미지정'}
                </p>
              </div>
            ) : (
              <p className="text-xs font-bold text-on-surface-variant opacity-60">
                이번 학기 회비 정책이 설정되지 않았습니다.
              </p>
            )}
          </div>
        </div>

        {/* 납부 현황 카드 */}
        <div className="bg-surface-container-low border border-card-border p-6 rounded-[2.5rem] relative overflow-hidden group">
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
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-6 lg:p-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRecords?.map((record) => (
            <div
              key={record.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                record.is_paid
                  ? 'bg-primary/[0.03] border-primary/10'
                  : 'bg-on-surface/[0.02] border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black truncate">{record.full_name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-on-surface/5 opacity-50 uppercase tracking-tighter">
                    {record.session}
                  </span>
                </div>
                {record.is_paid && record.paid_at && (
                  <p className="text-[9px] font-bold opacity-30">
                    {format(new Date(record.paid_at), 'MM.dd HH:mm', { locale: ko })}
                  </p>
                )}
              </div>
              <button
                onClick={async () => {
                  try {
                    const nextPaidStatus = !record.is_paid;
                    await markMembershipPaid.mutateAsync({
                      user_id: record.id,
                      year,
                      half,
                      is_paid: nextPaidStatus,
                    });
                    addToast(
                      nextPaidStatus ? `${record.full_name}님의 회비 납부가 확인되었습니다.` : `${record.full_name}님의 회비 납부가 취소되었습니다.`,
                      'success'
                    );
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : '처리 중 오류가 발생했습니다.';
                    addToast(msg, 'error');
                  }
                }}
                disabled={markMembershipPaid.isPending}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  record.is_paid
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-on-surface/10 text-on-surface opacity-30 hover:opacity-100 hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-black">
                  {record.is_paid ? 'check' : 'close'}
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
  )
}

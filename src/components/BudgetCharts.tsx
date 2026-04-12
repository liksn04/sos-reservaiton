import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import type { TooltipContentProps, TooltipPayloadEntry, TooltipValueType } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import type { BudgetTransaction } from '../types'

interface Props {
  transactions: BudgetTransaction[]
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
type BudgetTooltipName = string | number
type BudgetTooltipEntry = TooltipPayloadEntry<TooltipValueType, BudgetTooltipName>

interface TooltipDatum {
  name?: string
  date?: string
}

interface BudgetChartsTooltipProps extends Partial<TooltipContentProps<TooltipValueType, BudgetTooltipName>> {
  isDark: boolean
}

function getTooltipNumericValue(value: TooltipValueType | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (Array.isArray(value)) {
    const [firstValue] = value
    if (typeof firstValue === 'number') {
      return firstValue
    }

    if (typeof firstValue === 'string') {
      const parsed = Number(firstValue)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  return 0
}

function BudgetChartsTooltip({ active, payload, isDark }: BudgetChartsTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const currentPayload = payload[0] as BudgetTooltipEntry | undefined
  const currentDatum = currentPayload?.payload as TooltipDatum | undefined

  return (
    <div
      className="rounded-2xl p-4 text-[11px] font-bold shadow-2xl border backdrop-blur-xl"
      style={{
        background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: 'var(--card-border)',
        color: 'var(--text-main)',
      }}
    >
      <p className="mb-2 opacity-50 uppercase tracking-widest">{currentDatum?.name || currentDatum?.date}</p>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color || entry.fill }}>{entry.name}</span>
            <span className="font-black">
              {getTooltipNumericValue(entry.value).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만원
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BudgetCharts({ transactions }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'
  const axisStyle = { fill: textColor, fontSize: 11, fontWeight: 700 }

  // 월별 차트 데이터
  const monthlyData = useMemo(() => {
    const months: Record<number, { income: number; expense: number }> = {}
    transactions.forEach((t) => {
      const date = new Date(t.transaction_date + 'T00:00:00')
      const month = date.getMonth() + 1
      if (!months[month]) months[month] = { income: 0, expense: 0 }
      if (t.type === 'income') months[month].income += Number(t.amount)
      else months[month].expense += Number(t.amount)
    })
    return MONTHS.map((label, idx) => ({
      name: label,
      수입: (months[idx + 1]?.income ?? 0) / 10000,
      지출: (months[idx + 1]?.expense ?? 0) / 10000,
    }))
  }, [transactions])

  // 카테고리별 지출 데이터
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {}
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category?.name ?? '기타'
        const color = t.category?.color ?? '#6b7280'
        if (!map[cat]) map[cat] = { name: cat, value: 0, color }
        map[cat].value += Number(t.amount) / 10000
      })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [transactions])

  // 누적 잔액 데이터
  const cumulativeData = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )
    return sorted.reduce<{ balance: number; items: { date: string; balance: number }[] }>(
      (acc, transaction) => {
        const nextBalance =
          acc.balance + (transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount))

        return {
          balance: nextBalance,
          items: [
            ...acc.items,
            {
              date: new Date(transaction.transaction_date + 'T00:00:00').toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              }),
              balance: nextBalance / 10000,
            },
          ],
        }
      },
      { balance: 0, items: [] }
    ).items
  }, [transactions])

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 월별 수입/지출 */}
      <div className="surface-card p-8">
        <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">bar_chart</span>
          </div>
          월별 수입 · 지출
        </h3>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                content={<BudgetChartsTooltip isDark={isDark} />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 900 }} />
              <Bar dataKey="수입" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 카테고리별 지출 & 누적 잔액 (그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 */}
        <div className="surface-card p-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-sm">pie_chart</span>
            </div>
            카테고리별 지출
          </h3>
          {expenseByCategory.length > 0 ? (
            <>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<BudgetChartsTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {expenseByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low border border-card-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-[10px] font-bold text-on-surface truncate">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant ml-1">{cat.value.toFixed(1)}만</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center opacity-30">
              <span className="material-symbols-outlined text-4xl mb-2">data_info_alert</span>
              <p className="text-xs font-bold">지출 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 누적 잔액 추이 */}
        <div className="surface-card p-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">show_chart</span>
            </div>
            누적 잔액 추이
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<BudgetChartsTooltip isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="잔액"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

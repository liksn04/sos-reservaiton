import { useBudgetAvailableYears } from '../hooks/useBudgetStatsByYear'

interface Props {
  selectedYear: number
  onYearChange: (year: number) => void
}

export default function YearArchiveSelector({ selectedYear, onYearChange }: Props) {
  const { data: years, isLoading } = useBudgetAvailableYears()

  if (isLoading || !years) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 px-1 no-scrollbar">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`px-6 py-2 rounded-2xl text-[10px] font-black italic transition-all whitespace-nowrap shadow-sm border ${
            selectedYear === year
              ? 'bg-primary text-white border-primary shadow-primary/20 scale-105'
              : 'bg-surface-container-low border-card-border text-on-surface-variant opacity-70 hover:opacity-100 hover:bg-white/5'
          }`}
        >
          {year} 학기
        </button>
      ))}
    </div>
  )
}

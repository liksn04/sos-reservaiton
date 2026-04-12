import { useBudgetAvailableYears } from '../hooks/useBudgetStatsByYear'

interface Props {
  selectedYear: number
  onYearChange: (year: number) => void
}

export default function YearArchiveSelector({ selectedYear, onYearChange }: Props) {
  const { data: years, isLoading } = useBudgetAvailableYears()

  if (isLoading || !years) return null

  return (
    <div className="segmented-control overflow-x-auto pb-1 px-1 no-scrollbar">
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`segmented-option whitespace-nowrap ${selectedYear === year ? 'active' : ''}`}
        >
          {year}년
        </button>
      ))}
    </div>
  )
}

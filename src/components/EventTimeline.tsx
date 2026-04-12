import { useMemo, useState } from 'react'
import type { ClubEventWithDetails } from '../types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  events: ClubEventWithDetails[]
}

export default function EventTimeline({ events }: Props) {
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all')

  // 사용 가능한 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    events.forEach((ev) => {
      years.add(ev.start_date.split('-')[0])
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [events])

  // 필터링 및 그룹화 로직
  const groupedEvents = useMemo(() => {
    const filtered = selectedYear === 'all' 
      ? events 
      : events.filter(ev => ev.start_date.startsWith(selectedYear))

    const groups: Record<string, ClubEventWithDetails[]> = {}
    
    // 날짜 역순 정렬
    const sorted = [...filtered].sort((a, b) => b.start_date.localeCompare(a.start_date))
    
    sorted.forEach((ev) => {
      const year = ev.start_date.split('-')[0]
      if (!groups[year]) groups[year] = []
      groups[year].push(ev)
    })
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [events, selectedYear])

  return (
    <div className="space-y-8 animate-slide-up">
      {/* 연도 필터 칩 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar">
        <button
          onClick={() => setSelectedYear('all')}
          className={`px-6 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap shadow-sm border shrink-0 ${
            selectedYear === 'all'
              ? 'bg-primary text-white border-primary shadow-primary/20 scale-105 z-10'
              : 'bg-surface-container-low border-card-border text-on-surface-variant opacity-80 hover:opacity-100'
          }`}
        >
          ALL TIME
        </button>
        {availableYears.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-6 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap shadow-sm border shrink-0 ${
              selectedYear === year
                ? 'bg-secondary text-white border-secondary shadow-secondary/20 scale-105 z-10'
                : 'bg-surface-container-low border-card-border text-on-surface-variant opacity-80 hover:opacity-100'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="relative pl-4">
        {/* 중앙 타임라인 라인 */}
        <div 
          className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/60 via-secondary/60 to-transparent opacity-40"
        />

        <div className="space-y-16">
          {groupedEvents.map(([year, yearEvents]) => (
            <div key={year} className="relative">
              {/* 연도 헤더 */}
              <div className="flex items-center mb-8 sticky top-0 z-20 pointer-events-none">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-xl backdrop-blur-xl transition-all"
                  style={{ 
                    backgroundColor: 'rgba(var(--surface-rgb), 0.95)', 
                    borderColor: 'var(--card-border)',
                    marginLeft: '12px', // 선의 중심(40px)에 배지 중심을 맞춤: 40 - (56/2) = 12px
                    zIndex: 30
                  }}
                >
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] font-black tracking-widest text-primary/50 mb-0.5">YEAR</span>
                    <span className="text-sm font-black tracking-tighter text-primary">{year}</span>
                  </div>
                </div>
              </div>

              {/* 일정 카드 리스트 */}
              <div className="space-y-12 pl-20 relative">
                {yearEvents.map((ev) => {
                  const cat = ev.category
                  const date = new Date(ev.start_date + 'T00:00:00')
                  
                  return (
                    <div key={ev.id} className="relative group">
                      {/* 타임라인 노드 아이콘 */}
                      <div 
                        className="absolute -left-[60px] top-2 w-10 h-10 rounded-2xl flex items-center justify-center z-10 border-4 border-surface transition-transform group-hover:scale-125 group-hover:rotate-12 shadow-lg"
                        style={{ backgroundColor: cat?.color || 'var(--primary)' }}
                      >
                        <span className="material-symbols-outlined text-lg text-white">
                          {cat?.icon || 'event'}
                        </span>
                      </div>

                      {/* 내용 카드 */}
                      <div className="surface-card p-6 transition-all group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/5 overflow-hidden relative">
                        {/* 배경 데코레이션 */}
                        <div 
                          className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-30"
                          style={{ backgroundColor: cat?.color || 'var(--primary)' }}
                        />

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              {cat && (
                                <span 
                                  className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                  {cat.name}
                                </span>
                              )}
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">
                                {format(date, 'EEEE', { locale: ko })}
                              </span>
                            </div>
                            
                            <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface mb-2 group-hover:text-primary transition-colors">
                              {ev.title}
                            </h3>
                            
                            {ev.description && (
                              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                {ev.description}
                              </p>
                            )}
                            
                            {ev.location && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-primary/60">
                                <span className="material-symbols-outlined text-[14px]">place</span>
                                {ev.location}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end min-w-fit">
                            <div className="font-headline text-2xl font-bold tracking-tighter text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                              <span>{format(date, 'MM.dd')}</span>
                              <span className="text-[10px] pb-1 opacity-40">
                                {format(date, 'eee', { locale: ko })}
                              </span>
                            </div>
                            {ev.participants && ev.participants.length > 0 && (
                              <div className="flex -space-x-2 mt-2">
                                {ev.participants.slice(0, 3).map((p, idx) => (
                                  <div 
                                    key={idx}
                                    className="w-6 h-6 rounded-full border-2 border-surface bg-gray-200 overflow-hidden flex items-center justify-center text-[8px] font-black"
                                    title={p.profile?.display_name}
                                  >
                                    {p.profile?.avatar_url ? (
                                      <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      p.profile?.display_name?.charAt(0)
                                    )}
                                  </div>
                                ))}
                                {ev.participants.length > 3 && (
                                  <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center text-[8px] font-black">
                                    +{ev.participants.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {events.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale-[0.5]">
          <span className="material-symbols-outlined text-6xl mb-4 text-primary/30">history</span>
          <p className="font-headline text-sm font-bold text-on-surface/40">일정 역사가 아직 없습니다.</p>
        </div>
      )}
    </div>
  )
}

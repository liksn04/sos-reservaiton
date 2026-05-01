import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useDeleteReservation } from '../hooks/mutations/useDeleteReservation';
import Calendar from '../components/Calendar';
import DailySchedule from '../components/DailySchedule';
import ReservationDetailModal from '../components/ReservationDetailModal';
import { useToast } from '../contexts/useToast';
import { computeSlotAvailability, formatDate, getTimeSlots, normalizeTime } from '../utils/time';
import type { Purpose, ReservationWithDetails } from '../types';
import type { AppShellContext } from './AppShell';

type CalendarView = 'month' | 'week' | 'day';
type ReservationScope = 'all' | 'mine';
type PurposeFilter = 'all' | Purpose;

const DAY_START_TIMES = getTimeSlots().filter((time) => time !== '24:00');
const DAY_HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));

export default function Reserve() {
  const { profile } = useAuth();
  const { data: reservations = [] } = useReservations();
  const { openNew, openEdit } = useOutletContext<AppShellContext>();
  const { addToast } = useToast();
  const deleteReservation = useDeleteReservation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [scope, setScope] = useState<ReservationScope>('all');
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('all');

  const selectedDateStr = formatDate(selectedDate);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const isMine =
        reservation.host_id === profile?.id ||
        reservation.reservation_invitees?.some((invitee) => invitee.user_id === profile?.id);
      const matchesScope = scope === 'all' || isMine;
      const matchesPurpose = purposeFilter === 'all' || reservation.purpose === purposeFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        reservation.team_name.toLowerCase().includes(normalizedSearch) ||
        reservation.host?.display_name?.toLowerCase().includes(normalizedSearch) ||
        reservation.purpose.toLowerCase().includes(normalizedSearch);

      return matchesScope && matchesPurpose && matchesSearch;
    });
  }, [normalizedSearch, profile?.id, purposeFilter, reservations, scope]);

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  const selectedDayReservations = useMemo(
    () => filteredReservations
      .filter((reservation) => reservation.date === selectedDateStr)
      .sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time))),
    [filteredReservations, selectedDateStr],
  );
  const daySlotAvailability = useMemo(
    () => computeSlotAvailability(selectedDateStr, filteredReservations, null, DAY_START_TIMES[0], '합주'),
    [filteredReservations, selectedDateStr],
  );

  function handleMonthChange(delta: 1 | -1) {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  function handleVisibleRangeChange(delta: 1 | -1) {
    if (calendarView === 'month') {
      handleMonthChange(delta);
      return;
    }

    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + (calendarView === 'week' ? delta * 7 : delta));
    handleSelectDate(nextDate);
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (
      date.getMonth() !== currentMonth.getMonth() ||
      date.getFullYear() !== currentMonth.getFullYear()
    ) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  async function handleDelete(id: string, teamName: string) {
    if (!confirm(`[${teamName}] 팀의 예약을 취소하시겠습니까?`)) return;
    try {
      await deleteReservation.mutateAsync(id);
      setSelectedReservation((current) => (current?.id === id ? null : current));
    } catch {
      alert('예약 취소에 실패했습니다. 네트워크 연결을 확인해주세요.');
    }
  }

  return (
    <>
      <div className="animate-slide-up">
        <section className="mb-8">
          <div className="club-tag">예약 캘린더</div>
          <h2 className="dashboard-title">합주실 예약</h2>
          <p className="dashboard-subtitle">월/주/일 보기와 내 예약 필터로 필요한 일정만 빠르게 확인하세요.</p>
        </section>

        <section className="mb-6 space-y-3">
          <div className="segmented-control flex w-full overflow-x-auto no-scrollbar">
            {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={`segmented-option flex-1 whitespace-nowrap ${calendarView === view ? 'active' : ''}`}
              >
                {view === 'month' ? '월' : view === 'week' ? '주' : '일'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="예약명, 예약자, 목적 검색"
                className="w-full bg-surface-container-low border border-card-border rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={purposeFilter}
                onChange={(event) => setPurposeFilter(event.target.value as PurposeFilter)}
                className="min-h-[52px] w-full min-w-0 rounded-2xl border border-card-border bg-surface-container-low px-4 text-sm font-bold text-on-surface"
              >
                <option value="all">전체 목적</option>
                <option value="합주">합주</option>
                <option value="강습">강습</option>
                <option value="정기회의">정기회의</option>
                <option value="오디션">오디션</option>
              </select>
              <button
                type="button"
                onClick={() => setScope((current) => current === 'all' ? 'mine' : 'all')}
                className={`min-h-[52px] rounded-2xl border border-card-border bg-surface-container-low px-4 text-sm font-black text-on-surface transition-all ${scope === 'mine' ? '!border-primary/50 !text-primary bg-primary/10' : ''}`}
              >
                {scope === 'mine' ? '내 예약' : '전체 예약'}
              </button>
            </div>
          </div>
        </section>

        {/* 달력 카드 */}
        <div className="page-section-card p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-headline" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {calendarView === 'month'
                ? `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`
                : `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleVisibleRangeChange(-1)}
                className="material-symbols-outlined w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-lowest border border-card-border"
                style={{ color: 'var(--text-muted)' }}
              >
                chevron_left
              </button>
              <button
                onClick={() => handleVisibleRangeChange(1)}
                className="material-symbols-outlined w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-lowest border border-card-border"
                style={{ color: 'var(--text-muted)' }}
              >
                chevron_right
              </button>
            </div>
          </div>

          {calendarView === 'month' ? (
            <Calendar
              reservations={filteredReservations}
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              onSelectDate={handleSelectDate}
              onMonthChange={handleMonthChange}
            />
          ) : calendarView === 'week' ? (
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const dateStr = formatDate(date);
                const count = filteredReservations.filter((reservation) => reservation.date === dateStr).length;
                const isSelected = dateStr === selectedDateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`rounded-[1.25rem] border px-2 py-3 text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-card-border bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase opacity-70">
                      {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                    </p>
                    <p className="mt-1 text-lg font-black">{date.getDate()}</p>
                    <p className="mt-1 text-[10px] font-bold opacity-70">{count}건</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {DAY_HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[3.25rem_1fr] items-center gap-2 rounded-[1.25rem] border border-card-border bg-surface-container-low/60 px-3 py-2"
                >
                  <div className="text-sm font-black tabular-nums text-on-surface">
                    {hour}:00
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([`${hour}:00`, `${hour}:30`] as const).map((time) => {
                      const occupied = selectedDayReservations.some((reservation) =>
                        normalizeTime(reservation.start_time) <= time &&
                        normalizeTime(reservation.end_time) > time,
                      );
                      const unavailable = daySlotAvailability.disabledStarts.has(time);
                      const blocked = occupied || unavailable;
                      const slotLabel = occupied ? '예약 있음' : unavailable ? '예약 불가' : '빈 슬롯';

                      return (
                        <button
                          key={time}
                          type="button"
                          aria-label={`${time} ${slotLabel}`}
                          aria-disabled={blocked}
                          onClick={() => {
                            if (occupied) {
                              addToast('이미 예약된 시간입니다. 다른 빈 슬롯을 선택해주세요.', 'warning');
                              return;
                            }
                            if (unavailable) {
                              addToast('현재 선택할 수 없는 시간입니다. 다른 빈 슬롯을 선택해주세요.', 'warning');
                              return;
                            }
                            openNew(selectedDate, time);
                          }}
                          className={`min-h-10 rounded-2xl border px-2 text-center text-[11px] font-black transition-all ${
                            blocked
                              ? 'cursor-not-allowed border-transparent bg-surface-container text-on-surface-variant opacity-55'
                              : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                          }`}
                        >
                          <span className="block tabular-nums">{time.slice(3)}</span>
                          <span className="block text-[10px] opacity-70">{slotLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 선택 날짜 일정 */}
        <div className="mt-10">
          <div className="sticky top-20 z-40 -mx-1 mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-card-border bg-background/90 px-3 py-3 backdrop-blur-xl">
            <h3 className="font-headline text-lg font-bold leading-tight text-on-surface">
              선택된 날짜{' '}
              <span style={{ color: 'var(--primary)' }}>
                {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
              </span>
            </h3>
            <button
              className="reserve-now-btn !min-h-11 !w-auto shrink-0 !px-4 !py-2 text-sm"
              onClick={() => openNew(selectedDate)}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontWeight: 'bold' }}>add_circle</span>
              예약 추가
            </button>
          </div>

          <DailySchedule
            reservations={filteredReservations}
            selectedDate={selectedDate}
            currentUserId={profile?.id ?? ''}
            isAdmin={profile?.is_admin}
            onView={setSelectedReservation}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ReservationDetailModal
        isOpen={selectedReservation !== null}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
        currentUserId={profile?.id ?? ''}
        isAdmin={profile?.is_admin}
      />
    </>
  );
}

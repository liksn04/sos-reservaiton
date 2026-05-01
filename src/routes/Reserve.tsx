import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useDeleteReservation } from '../hooks/mutations/useDeleteReservation';
import Calendar from '../components/Calendar';
import DailySchedule from '../components/DailySchedule';
import ReservationDetailModal from '../components/ReservationDetailModal';
import { formatDate, normalizeTime } from '../utils/time';
import { canManageReservations } from '../utils/roles';
import type { Purpose, ReservationWithDetails } from '../types';
import type { AppShellContext } from './AppShell';

type CalendarView = 'month' | 'week' | 'day';
type ReservationScope = 'all' | 'mine';
type PurposeFilter = 'all' | Purpose;

const QUICK_START_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

export default function Reserve() {
  const { profile } = useAuth();
  const { data: reservations = [] } = useReservations();
  const { openNew, openEdit } = useOutletContext<AppShellContext>();
  const deleteReservation = useDeleteReservation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [scope, setScope] = useState<ReservationScope>('all');
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('all');

  const canManage = canManageReservations(profile);
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

  function handleMonthChange(delta: 1 | -1) {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
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
                {view === 'month' ? '월' : view === 'week' ? '주' : '일'} 보기
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
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
            <select
              value={purposeFilter}
              onChange={(event) => setPurposeFilter(event.target.value as PurposeFilter)}
              className="bg-surface-container-low border border-card-border rounded-2xl px-4 py-3.5 text-sm font-bold text-on-surface"
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
              className={`secondary-btn !h-auto !min-w-[120px] !px-4 ${scope === 'mine' ? '!border-primary/50 !text-primary' : ''}`}
            >
              {scope === 'mine' ? '내 예약' : '전체 예약'}
            </button>
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
                onClick={() => handleMonthChange(-1)}
                className="material-symbols-outlined w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-lowest border border-card-border"
                style={{ color: 'var(--text-muted)' }}
              >
                chevron_left
              </button>
              <button
                onClick={() => handleMonthChange(1)}
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {QUICK_START_TIMES.map((time) => {
                const occupied = selectedDayReservations.some((reservation) =>
                  normalizeTime(reservation.start_time) <= time &&
                  normalizeTime(reservation.end_time) > time,
                );
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => openNew(selectedDate)}
                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition-all ${
                      occupied
                        ? 'border-card-border bg-surface-container-low text-on-surface-variant'
                        : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                    }`}
                  >
                    <p className="text-sm font-black">{time}</p>
                    <p className="mt-1 text-[11px] font-bold opacity-70">
                      {occupied ? '예약 있음' : '빈 슬롯'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 선택 날짜 일정 */}
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h3 className="font-headline" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
              선택된 날짜{' '}
              <span style={{ color: 'var(--primary)' }}>
                {selectedDate.getMonth() + 1}/{selectedDate.getDate()}
              </span>
            </h3>
          </div>

          <DailySchedule
            reservations={filteredReservations}
            selectedDate={selectedDate}
            currentUserId={profile?.id ?? ''}
            isAdmin={canManage}
            onView={setSelectedReservation}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>

        <button
          className="reserve-now-btn min-w-[200px] mx-auto mt-8 block"
          onClick={() => openNew(selectedDate)}
        >
          <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>add_circle</span>
          예약 시간 추가하기
        </button>
      </div>

      <ReservationDetailModal
        isOpen={selectedReservation !== null}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
        currentUserId={profile?.id ?? ''}
        isAdmin={canManage}
      />
    </>
  );
}

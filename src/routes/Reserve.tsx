import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useDeleteReservation } from '../hooks/mutations/useDeleteReservation';
import Calendar from '../components/Calendar';
import DailySchedule from '../components/DailySchedule';
import type { AppShellContext } from './AppShell';

export default function Reserve() {
  const { profile } = useAuth();
  const { data: reservations = [] } = useReservations();
  const { openNew, openEdit } = useOutletContext<AppShellContext>();
  const deleteReservation = useDeleteReservation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    } catch {
      alert('예약 취소에 실패했습니다. 네트워크 연결을 확인해주세요.');
    }
  }

  return (
    <div className="animate-slide-up">
      <section className="mb-8">
        <div className="club-tag">예약 캘린더</div>
        <h2 className="dashboard-title">합주실 예약</h2>
        <p className="dashboard-subtitle">날짜를 고르고, 선택된 일정에서 바로 예약을 추가하거나 수정할 수 있어요.</p>
      </section>

      {/* 달력 카드 */}
      <div className="page-section-card p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 className="font-headline" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
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

        <Calendar
          reservations={reservations}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onSelectDate={handleSelectDate}
          onMonthChange={handleMonthChange}
        />
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
          reservations={reservations}
          selectedDate={selectedDate}
          currentUserId={profile?.id ?? ''}
          isAdmin={profile?.is_admin}
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
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import Calendar from '../components/Calendar';
import DailySchedule from '../components/DailySchedule';
import UpcomingBar from '../components/UpcomingBar';
import ReservationModal from '../components/ReservationModal';
import { supabase } from '../lib/supabase';
import type { ReservationWithDetails } from '../types';

export default function Home() {
  const { profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: reservations = [], isLoading } = useReservations();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationWithDetails | null>(null);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(res: ReservationWithDetails) {
    setEditing(res);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleMonthChange(delta: 1 | -1) {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  async function handleDelete(id: string, teamName: string) {
    if (!confirm(`[${teamName}] 팀의 예약을 취소하시겠습니까?`)) return;
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) {
      alert('예약 취소에 실패했습니다. 네트워크 연결을 확인해주세요.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  }

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="glass-header">
        <div className="header-content">
          <div className="logo">
            <i className="fa-solid fa-music" />
            빛소리 동아리방 <span>예약</span>
          </div>

          <nav className="header-nav">
            <Link to="/my-reservations" className="nav-link">
              <i className="fa-regular fa-calendar-check" /> 나의 예약
            </Link>
            <Link to="/profile" className="nav-link">
              <i className="fa-regular fa-user" /> 프로필
            </Link>
            {profile?.is_admin && (
              <Link to="/admin" className="nav-link admin-link">
                <i className="fa-solid fa-shield" /> 관리자
              </Link>
            )}
          </nav>

          <div className="header-actions">
            <button className="primary-btn" onClick={openNew}>
              <i className="fa-solid fa-plus" /> 예약하기
            </button>
            <button className="icon-btn" onClick={signOut} title="로그아웃">
              <i className="fa-solid fa-arrow-right-from-bracket" />
            </button>
          </div>
        </div>
      </header>

      {/* 다가오는 예약 */}
      {isLoading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <UpcomingBar reservations={reservations} />
      )}

      {/* 캘린더 + 일일 스케줄 */}
      <div className="calendar-row">
        <Calendar
          reservations={reservations}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          onSelectDate={(date) => {
            setSelectedDate(date);
            // 선택한 날짜가 다른 월이면 currentMonth도 이동
            if (
              date.getMonth() !== currentMonth.getMonth() ||
              date.getFullYear() !== currentMonth.getFullYear()
            ) {
              setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
          }}
          onMonthChange={handleMonthChange}
        />

        <DailySchedule
          reservations={reservations}
          selectedDate={selectedDate}
          currentUserId={profile?.id ?? ''}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* 예약 모달 */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialDate={selectedDate}
        editing={editing}
        reservations={reservations}
        currentUserId={profile?.id ?? ''}
      />
    </div>
  );
}

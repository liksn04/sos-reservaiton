import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { normalizeTime } from '../utils/time';
import ReservationModal from '../components/ReservationModal';
import { useReservations } from '../hooks/useReservations';
import type { MyReservation, ReservationWithDetails } from '../types';

export default function MyReservations() {
  const { profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: allReservations = [] } = useReservations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationWithDetails | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // 내가 호스트이거나 초대받은 미래 예약 필터링
  const myReservations: MyReservation[] = allReservations
    .filter((r) => {
      const isHost = r.host_id === profile?.id;
      const isInvitee = r.reservation_invitees?.some((inv) => inv.user_id === profile?.id);
      return (isHost || isInvitee) && r.date >= today;
    })
    .map((r) => ({
      ...r,
      role: (r.host_id === profile?.id ? 'host' : 'invitee') as 'host' | 'invitee',
    }))
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time));
    });

  async function handleDelete(id: string, teamName: string) {
    if (!confirm(`[${teamName}] 팀의 예약을 취소하시겠습니까?`)) return;
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) {
      alert('예약 취소에 실패했습니다.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  }

  async function handleLeave(reservationId: string, teamName: string) {
    if (!profile) return;
    if (!confirm(`[${teamName}] 합주에서 빠지시겠습니까?`)) return;
    const { error } = await supabase
      .from('reservation_invitees')
      .delete()
      .eq('reservation_id', reservationId)
      .eq('user_id', profile.id);
    if (error) {
      alert('처리에 실패했습니다.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  }

  function openEdit(res: ReservationWithDetails) {
    setEditing(res);
    setModalOpen(true);
  }

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="header-content">
          <div className="logo">
            <i className="fa-solid fa-music" />
            빛소리 동아리방 <span>예약</span>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">
              <i className="fa-regular fa-calendar" /> 캘린더
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
            <button className="icon-btn" onClick={signOut} title="로그아웃">
              <i className="fa-solid fa-arrow-right-from-bracket" />
            </button>
          </div>
        </div>
      </header>

      <div className="glass-card">
        <div className="schedule-header" style={{ marginBottom: '1.5rem' }}>
          <h2>나의 예약</h2>
          <span className="badge">{myReservations.length}건</span>
        </div>

        {myReservations.length === 0 ? (
          <div className="empty-state">
            <i className="fa-regular fa-calendar-xmark" />
            <p>예정된 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="my-res-list">
            {myReservations.map((res) => {
              const d = new Date(res.date + 'T00:00:00');
              const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
              const start = normalizeTime(res.start_time);
              const end = normalizeTime(res.end_time);

              return (
                <div key={res.id} className={`my-res-card${res.role === 'host' ? ' host-card' : ' invitee-card'}`}>
                  <div className="my-res-top">
                    <span className="my-res-date">{dateLabel}</span>
                    <div className="my-res-badges">
                      <span className="purpose-badge">{res.purpose}</span>
                      <span className={`role-badge ${res.role}`}>
                        {res.role === 'host' ? '주최자' : '초대됨'}
                      </span>
                    </div>
                  </div>

                  <div className="my-res-team">{res.team_name}</div>

                  <div className="my-res-meta">
                    <span>
                      <i className="fa-regular fa-clock" /> {start} - {end}
                      {res.is_next_day && <span className="next-day-badge">(익일)</span>}
                    </span>
                    <span>
                      <i className="fa-regular fa-user" /> {res.host?.display_name} ({res.people_count}명)
                    </span>
                  </div>

                  {/* 초대된 참여자 목록 */}
                  {res.reservation_invitees && res.reservation_invitees.length > 0 && (
                    <div className="my-res-invitees">
                      <i className="fa-solid fa-users" /> 참여자 {res.reservation_invitees.length}명
                    </div>
                  )}

                  <div className="schedule-actions">
                    {res.role === 'host' ? (
                      <>
                        <button className="edit-res-btn" onClick={() => openEdit(res)}>
                          <i className="fa-solid fa-pen" /> 수정
                        </button>
                        <button className="delete-res-btn" onClick={() => handleDelete(res.id, res.team_name)}>
                          <i className="fa-solid fa-trash-can" /> 취소
                        </button>
                      </>
                    ) : (
                      <button className="leave-btn" onClick={() => handleLeave(res.id, res.team_name)}>
                        <i className="fa-solid fa-right-from-bracket" /> 합주에서 빠지기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReservationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initialDate={editing ? new Date(editing.date + 'T00:00:00') : new Date()}
        editing={editing}
        reservations={allReservations}
        currentUserId={profile?.id ?? ''}
      />
    </div>
  );
}

import type { ReservationWithDetails } from '../types';
import { normalizeTime } from '../utils/time';

interface DashboardViewProps {
  reservations: ReservationWithDetails[];
  totalUserCount: number;
  onViewSchedule: () => void;
}

export default function DashboardView({ 
  reservations, 
  totalUserCount, 
  onViewSchedule,
}: DashboardViewProps) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:mm"

  // ── 이번 주 예약 건수 ─────────────────────────────
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeekReservations = reservations.filter(r => {
    const d = new Date(r.date);
    return d >= startOfWeek && d <= endOfWeek;
  });

  // ── 현재 진행 중인 세션 (Ongoing now) ───────────────────
  const ongoing = reservations.find(r => 
    r.date === todayStr && 
    currentTimeStr >= r.start_time && 
    currentTimeStr <= r.end_time
  );

  // ── 다가오는 일정 ──────────────────────────
  const upcoming = reservations
    .filter(r => r.date >= todayStr && !(r.id === ongoing?.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 1)[0];

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="animate-slide-up">
      {/*Greeting Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="club-tag">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>music_note</span>
          빛소리 밴드 동아리
        </div>
        <h2 className="dashboard-title italic">
          <span className="text-gradient-white-purple">오늘도 뜨겁게</span><br />
          <span>연주해 볼까요?</span>
        </h2>
        <p className="dashboard-subtitle">
          동아리방 예약 현황을 확인하고<br/>당신의 다음 합주를 준비하세요.
        </p>
      </section>

      {/* Ongoing Session (Pulse Highlight) */}
      {ongoing && (
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <div className="ongoing-glow-bg"></div>
          <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(204,151,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="live-indicator pulse-purple"></div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem', display: 'block' }}>현재 진행 중</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{ongoing.purpose}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ongoing.team_name}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>{normalizeTime(ongoing.start_time)} - {normalizeTime(ongoing.end_time)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Schedule Card */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '700', color: 'white' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>schedule</span>
            다가오는 일정
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', cursor: 'pointer' }} onClick={onViewSchedule}>
            전체보기 &gt;
          </span>
        </div>
        
        {upcoming ? (
          <div className="upcoming-hero-card" onClick={onViewSchedule} style={{ cursor: 'pointer', background: 'var(--surface-container)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="upcoming-meta">
              <div>
                <p className="upcoming-date" style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>{formatDateLabel(upcoming.date)}</p>
                <p className="upcoming-time" style={{ color: 'var(--primary)', fontWeight: '600' }}>{normalizeTime(upcoming.start_time)} - {normalizeTime(upcoming.end_time)}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{upcoming.team_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-card">
            현재 진행 중인 합주가 없습니다.
          </div>
        )}
      </section>

      {/* Stats Bento Grid */}
      <section className="stats-bento">
        <div className="stat-item">
          <div className="stat-icon-bg blue">
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
          <div>
            <p className="stat-value">{thisWeekReservations.length}건</p>
            <p className="stat-label">이번 주 총 예약</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon-bg green">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <p className="stat-value">{totalUserCount}명</p>
            <p className="stat-label">활성 동아리원</p>
          </div>
        </div>
      </section>

      {/* Reserve Now Button */}
      <button className="reserve-now-btn" onClick={onViewSchedule}>
        <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>add_circle</span>
        <span>예약하기</span>
      </button>
    </div>
  );
}

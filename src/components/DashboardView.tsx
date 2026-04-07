import { useNavigate } from 'react-router-dom';
import type { ReservationWithDetails } from '../types';
import { normalizeTime } from '../utils/time';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardViewProps {
  reservations: ReservationWithDetails[];
  totalUserCount: number;
}

export default function DashboardView({ reservations, totalUserCount }: DashboardViewProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
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

  const thisWeekReservations = reservations.filter((r) => {
    const d = new Date(r.date);
    return d >= startOfWeek && d <= endOfWeek;
  });

  // ── 현재 진행 중인 세션 ───────────────────────────
  const ongoing = reservations.find((r) => {
    const start = r.start_time.slice(0, 5); // "HH:mm"
    const end = r.end_time.slice(0, 5);
    return r.date === todayStr && currentTimeStr >= start && currentTimeStr < end;
  });

  // ── 다음 일정 (진행 중인 것 제외) ─────────────────
  const nextRes = reservations
    .filter((r) => {
      // 1. 현재 진행 중인 세션은 제외 (primaryRes에서 따로 세밀히 처리됨)
      if (r.id === ongoing?.id) return false;
      
      // 2. 미래의 날짜인 경우 포함
      if (r.date > todayStr) return true;
      
      // 3. 오늘인 경우: 현재 시간 이후에 시작하는 것만 포함
      if (r.date === todayStr) {
        const startTime = r.start_time.slice(0, 5);
        return startTime > currentTimeStr;
      }
      
      return false;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .at(0);

  // ── 메인 표시 가공 ──────────────────────────────
  const primaryRes = ongoing || nextRes;
  const isOngoingNow = !!ongoing;

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="animate-slide-up">
      {/* Greeting Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div className="club-tag">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>music_note</span>
          빛소리 밴드 동아리
        </div>
        <h2 className="dashboard-title italic">
          <span className="text-gradient-white-purple">
            {resolvedTheme === 'light' ? '오늘도 시원하게' : '오늘도 뜨겁게'}
          </span><br />
          <span>연주해 볼까요?</span>
        </h2>
        <p className="dashboard-subtitle">
          동아리방 예약 현황을 확인하고<br />당신의 다음 합주를 준비하세요.
        </p>
      </section>

      {/* Main Schedule Hero Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {isOngoingNow ? (
              <>
                <div className="live-indicator pulse-green" style={{ width: '10px', height: '10px' }}></div>
                <span style={{ color: 'var(--success)' }}>현재 진행 중</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>schedule</span>
                다가오는 일정
              </>
            )}
          </h3>
          <span
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', cursor: 'pointer' }}
            onClick={() => navigate('/reserve')}
          >
            전체보기 &gt;
          </span>
        </div>

        {primaryRes ? (
          <div
            className={`upcoming-hero-card ${isOngoingNow ? 'ongoing-hero-active' : ''}`}
            onClick={() => navigate('/reserve')}
            style={{ 
              cursor: 'pointer',
              background: 'var(--surface-container)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              minHeight: '190px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {isOngoingNow && <div className="ongoing-glow-bg opacity-40"></div>}
            
            {/* Top section of the card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{primaryRes.team_name}</h4>
              {isOngoingNow && (
                <div className="live-badge">ON AIR</div>
              )}
            </div>
            
            {/* Bottom section of the card */}
            <div style={{ position: 'relative', zIndex: 1, marginTop: '1rem' }}>
              <p className="upcoming-date" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {formatDateLabel(primaryRes.date)}
              </p>
              <p className="upcoming-time" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.15rem' }}>
                {normalizeTime(primaryRes.start_time)} - {normalizeTime(primaryRes.end_time)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>info</span>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500' }}>{primaryRes.purpose}</p>
              </div>
            </div>

            {/* Participants Avatar Group */}
            <div className="avatar-group" style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 2 }}>
              {(() => {
                const participants = [
                  ...(primaryRes.host ? [primaryRes.host] : []),
                  ...primaryRes.reservation_invitees
                    .map((i) => i.profile)
                    .filter((p): p is NonNullable<typeof p> => !!p),
                ];
                const maxDisplay = 4;
                const displayParticipants = participants.slice(0, maxDisplay);
                const hasMore = participants.length > maxDisplay;

                return (
                  <>
                    {hasMore && (
                      <div className="avatar-more">+{participants.length - maxDisplay}</div>
                    )}
                    {displayParticipants.reverse().map((p) => (
                      <div key={p.id} className="avatar-item" title={p.display_name}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.display_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">
                            {p.display_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="empty-card" style={{ background: 'var(--surface-container)', padding: '2.5rem', borderRadius: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.5 }}>calendar_today</span>
            <p>현재 예정된 합주가 없습니다.</p>
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
      <button className="reserve-now-btn" onClick={() => navigate('/reserve')}>
        <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>add_circle</span>
        <span>예약하기</span>
      </button>
    </div>
  );
}

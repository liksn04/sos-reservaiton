import { useNavigate } from 'react-router-dom';
import type { ReservationWithDetails } from '../types';
import {
  getNextReservation,
  getOngoingReservation,
  normalizeTime,
} from '../utils/time';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardViewProps {
  reservations: ReservationWithDetails[];
  totalUserCount: number;
}

export default function DashboardView({ reservations, totalUserCount }: DashboardViewProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const now = new Date();

  // ── 이번 주 예약 건수 ─────────────────────────────
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeekReservations = reservations.filter((r) => {
    const d = new Date(`${r.date}T00:00:00`);
    return d >= startOfWeek && d <= endOfWeek;
  });

  // ── 현재 진행 중인 세션 ───────────────────────────
  const ongoing = getOngoingReservation(reservations, now);

  // ── 다음 일정 (진행 중인 것 제외) ─────────────────
  const nextRes = getNextReservation(reservations, now, ongoing?.id);

  // ── 메인 표시 가공 ──────────────────────────────
  const primaryRes = ongoing || nextRes;
  const isOngoingNow = !!ongoing;
  const openReservePage = () => navigate('/reserve');

  const formatHeroDateLabel = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const weekDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${date.getMonth() + 1}월${date.getDate()}일 ${weekDays[date.getDay()]}`;
  };

  const formatHeroSupportLabel = (reservation: ReservationWithDetails, ongoingState: boolean) => {
    const startLabel = normalizeTime(reservation.start_time);
    const endLabel = normalizeTime(reservation.end_time);
    return ongoingState
      ? `${startLabel} 시작 · ${endLabel} 종료 예정`
      : `${startLabel} 시작 예정`;
  };

  const getHeroTitle = (reservation: ReservationWithDetails) => {
    const teamName = reservation.team_name.trim();
    return teamName.length > 0 ? teamName : `${reservation.purpose} 일정`;
  };

  return (
    <div className="animate-slide-up">
      <section className="mb-10">
        <div className="club-tag">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>music_note</span>
          빛소리 밴드 동아리
        </div>
        <h2 className="dashboard-title">
          <span className="text-gradient-white-purple">
            {resolvedTheme === 'light' ? '오늘도 시원하게' : '오늘도 뜨겁게'}
          </span><br />
          <span>연주해 볼까요?</span>
        </h2>
        <p className="dashboard-subtitle">
          동아리방 예약 현황을 확인하고<br />당신의 다음 합주를 준비하세요.
        </p>
      </section>

      <section className="mb-10">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h3 className="font-headline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {isOngoingNow ? (
              <>
                <div className="live-indicator pulse-green" style={{ width: '10px', height: '10px' }}></div>
                <span style={{ color: 'var(--success)' }}>현재 진행중</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>schedule</span>
                다가오는 일정
              </>
            )}
          </h3>
          <button
            type="button"
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            onClick={openReservePage}
          >
            전체보기 &gt;
          </button>
        </div>

        {primaryRes ? (
          <div
            className={`upcoming-hero-card ${isOngoingNow ? 'ongoing-hero-active' : ''}`}
            onClick={openReservePage}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openReservePage();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`${isOngoingNow ? '현재 진행중인' : '다가오는'} ${getHeroTitle(primaryRes)} 일정 상세 보기`}
            style={{
              cursor: 'pointer',
              borderRadius: '1.5rem',
              padding: '0.6rem',
              minHeight: '190px',
            }}
          >
            <div
              className="upcoming-hero-panel rounded-[1.75rem] h-full flex flex-col justify-between"
              style={{
                minHeight: '210px',
                padding: '1.75rem',
              }}
              >
              {isOngoingNow && <div className="ongoing-glow-bg opacity-30"></div>}

              <div className="upcoming-hero-top" style={{ position: 'relative', zIndex: 1 }}>
                <div className="upcoming-hero-top-copy">
                  <p className={`upcoming-hero-eyebrow ${isOngoingNow ? 'ongoing' : ''}`}>
                    {isOngoingNow ? formatHeroDateLabel(primaryRes.date) : '다음 일정'}
                  </p>
                  {!isOngoingNow && (
                    <>
                      <h4 className="upcoming-hero-date">{formatHeroDateLabel(primaryRes.date)}</h4>
                      <p className="upcoming-hero-date-sub">{formatHeroSupportLabel(primaryRes, false)}</p>
                    </>
                  )}
                </div>
                {isOngoingNow && (
                  <div className="live-badge">
                    <span className="live-badge-dot" aria-hidden="true"></span>
                    진행중
                  </div>
                )}
              </div>

              <div className="upcoming-hero-body" style={{ position: 'relative', zIndex: 1 }}>
                {isOngoingNow && (
                  <>
                    <h4 className="upcoming-hero-title ongoing">{getHeroTitle(primaryRes)}</h4>
                  </>
                )}
                {!isOngoingNow && (
                  <h5 className="upcoming-hero-title">{getHeroTitle(primaryRes)}</h5>
                )}
                <div className={`upcoming-hero-meta-row ${isOngoingNow ? 'ongoing' : ''}`}>
                  <div className="upcoming-hero-meta-chip">
                    <span className="material-symbols-outlined upcoming-hero-meta-icon">schedule</span>
                    <span>{normalizeTime(primaryRes.start_time)} - {normalizeTime(primaryRes.end_time)}</span>
                  </div>
                  <div className="upcoming-hero-meta-chip purpose">
                    <span className="material-symbols-outlined upcoming-hero-meta-icon">music_note</span>
                    <span>{primaryRes.purpose}</span>
                  </div>
                </div>
              </div>

              <div className="upcoming-hero-bottom" style={{ position: 'relative', zIndex: 1 }}>
                <span className="upcoming-hero-cta" aria-hidden="true">
                  {isOngoingNow ? '지금 일정 보기' : '일정 보러가기'}
                </span>
                {isOngoingNow ? (
                  <div className="upcoming-hero-orb" aria-hidden="true">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                ) : (
                  <div className="upcoming-hero-sidecard" aria-hidden="true">
                    <span className="upcoming-hero-sidecard-label">시작 예정</span>
                    <strong className="upcoming-hero-sidecard-value">
                      {normalizeTime(primaryRes.start_time)}
                    </strong>
                  </div>
                )}
              </div>
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

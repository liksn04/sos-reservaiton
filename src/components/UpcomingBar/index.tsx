import { getReservationTimestamp, normalizeTime } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
}

export default function UpcomingBar({ reservations }: Props) {
  const now = Date.now();

  const upcoming = reservations
    .map((r) => ({
      ...r,
      startTs: getReservationTimestamp(r.date, normalizeTime(r.start_time), false),
      endTs: getReservationTimestamp(r.date, normalizeTime(r.end_time), r.is_next_day),
    }))
    .filter((r) => r.endTs > now)
    .sort((a, b) => a.startTs - b.startTs)
    .slice(0, 5);

  return (
    <div className="glass-card upcoming-summary">
      <p className="upcoming-header">
        <i className="fa-regular fa-clock" /> 다가오는 예약
      </p>
      <div className="upcoming-list">
        {upcoming.length === 0 ? (
          <div className="empty-upcoming">
            <p>현재 다가오는 예약이 없습니다.</p>
          </div>
        ) : (
          upcoming.map((res) => {
            const d = new Date(res.startTs);
            const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
            const isOngoing = res.startTs <= now && res.endTs > now;
            const start = normalizeTime(res.start_time);
            const end = normalizeTime(res.end_time);

            return (
              <div key={res.id} className="upcoming-card">
                <div className="upcoming-card-header">
                  <span className="uc-date">{dateStr}</span>
                  {isOngoing && (
                    <span className="status-badge ongoing">진행중</span>
                  )}
                </div>
                <div className="uc-team">{res.team_name}</div>
                <div className="uc-time">
                  {start} - {end}
                  {res.is_next_day && ' (익일)'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

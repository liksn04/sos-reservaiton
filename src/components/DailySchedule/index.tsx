import { formatDate, normalizeTime } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentUserId: string;
  onEdit: (res: ReservationWithDetails) => void;
  onDelete: (id: string, teamName: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function DailySchedule({
  reservations,
  selectedDate,
  currentUserId,
  onEdit,
  onDelete,
}: Props) {
  const dateStr = formatDate(selectedDate);
  const dayRes = reservations
    .filter((r) => r.date === dateStr)
    .sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)));

  const title = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAYS[selectedDate.getDay()]})`;

  return (
    <div className="glass-card schedule-section">
      <div className="schedule-header">
        <h3>{title}</h3>
        <span className="badge">예약 내역</span>
      </div>

      <div className="timeline-container">
        {dayRes.length === 0 ? (
          <div className="empty-state">
            <i className="fa-regular fa-calendar-xmark" />
            <p>이 날은 예약이 없습니다.</p>
          </div>
        ) : (
          dayRes.map((res) => {
            const isHost = res.host_id === currentUserId;
            const isInvitee = res.reservation_invitees?.some(
              (inv) => inv.user_id === currentUserId,
            );
            const start = normalizeTime(res.start_time);
            const end = normalizeTime(res.end_time);

            return (
              <div key={res.id} className="schedule-item">
                <div className="schedule-item-header">
                  <span className="time-range">
                    {start} - {end}
                    {res.is_next_day && (
                      <span className="next-day-badge">(익일)</span>
                    )}
                  </span>
                  <span className="purpose-badge">{res.purpose}</span>
                </div>

                <div className="schedule-meta">
                  <span>
                    <i className="fa-regular fa-user" />{' '}
                    {res.host?.display_name ?? '알 수 없음'} ({res.people_count}명)
                  </span>
                  {isInvitee && !isHost && (
                    <span className="invitee-badge">초대됨</span>
                  )}
                </div>

                <div className="schedule-team-name">{res.team_name}</div>

                {/* 수정/삭제는 호스트만 */}
                {isHost && (
                  <div className="schedule-actions">
                    <button
                      className="edit-res-btn"
                      onClick={() => onEdit(res)}
                    >
                      <i className="fa-solid fa-pen" /> 수정
                    </button>
                    <button
                      className="delete-res-btn"
                      onClick={() => onDelete(res.id, res.team_name)}
                    >
                      <i className="fa-solid fa-trash-can" /> 취소
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

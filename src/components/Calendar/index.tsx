import { formatDate } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (delta: 1 | -1) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({
  reservations,
  selectedDate,
  currentMonth,
  onSelectDate,
  onMonthChange,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthTitle = `${year}년 ${month + 1}월`;

  return (
    <div className="glass-card calendar-section">
      {/* 월 네비게이션 */}
      <div className="calendar-nav">
        <button className="icon-btn" onClick={() => onMonthChange(-1)}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <h2 className="month-title">{monthTitle}</h2>
        <button className="icon-btn" onClick={() => onMonthChange(1)}>
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="weekdays">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      {/* 날짜 그리드 */}
      <div className="calendar-grid">
        {/* 첫째 날 이전 빈 칸 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="day-cell empty" />
        ))}

        {/* 날짜 셀 */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const cellDate = new Date(year, month, day);
          const dateStr = formatDate(cellDate);
          const isSelected = formatDate(selectedDate) === dateStr;
          const dayReservations = reservations.filter((r) => r.date === dateStr);
          const dow = cellDate.getDay();

          return (
            <div
              key={day}
              className={`day-cell${isSelected ? ' active' : ''}`}
              onClick={() => onSelectDate(cellDate)}
            >
              <div
                className="day-number"
                style={
                  dow === 0
                    ? { color: '#ef4444' }
                    : dow === 6
                    ? { color: '#3b82f6' }
                    : undefined
                }
              >
                {day}
              </div>
              {dayReservations.length > 0 && (
                <div className="res-indicator">{dayReservations.length}건</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

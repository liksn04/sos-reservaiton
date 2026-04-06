import { formatDate } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (delta: 1 | -1) => void;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function Calendar({
  reservations,
  selectedDate,
  currentMonth,
  onSelectDate,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="calendar-container animate-fade-in">
      {/* 요일 헤더 */}
      <div className="calendar-weekdays-grid">
        {WEEKDAYS.map((d, idx) => (
          <div 
            key={d} 
            className="weekday-label"
            style={{ color: idx === 0 ? 'var(--error)' : idx === 6 ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="calendar-days-grid">
        {/* 첫째 날 이전 빈 칸 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="day-cell-wrapper empty" />
        ))}

        {/* 날짜 셀 */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const cellDate = new Date(year, month, day);
          const dateStr = formatDate(cellDate);
          const isSelected = formatDate(selectedDate) === dateStr;
          const dayReservations = reservations.filter((r) => r.date === dateStr);
          const dow = cellDate.getDay();
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <div
              key={day}
              className={`day-cell-wrapper ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelectDate(cellDate)}
            >
              <div className="day-cell-content">
                <span 
                  className="day-number"
                  style={{ 
                    color: isSelected 
                      ? 'var(--on-primary-fixed)' 
                      : (dow === 0 ? 'var(--error)' : dow === 6 ? 'var(--primary)' : 'white')
                  }}
                >
                  {day}
                </span>
                {dayReservations.length > 0 && (
                  <div className="res-dot-indicator"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

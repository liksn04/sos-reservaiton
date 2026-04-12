import { useState } from 'react';
import { formatDate } from '../../utils/time';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function DatePicker({ isOpen, onClose, selectedDate, onSelect }: Props) {
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleMonthChange = (delta: number) => {
    setCurrentMonth(new Date(year, month + delta, 1));
  };

  const todayStr = formatDate(new Date());

  return (
    <div 
      className="modal-overlay active" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 1100 }}
    >
      <div 
        className="modal-container p-5" 
        style={{ maxWidth: '340px', backgroundColor: 'var(--surface-container-highest)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-lg font-bold tracking-tight">
            {year}년 <span className="text-primary">{month + 1}월</span>
          </h3>
          <div className="flex gap-2">
            <button 
              className="material-symbols-outlined text-white hover:text-primary transition-colors"
              onClick={() => handleMonthChange(-1)}
            >
              chevron_left
            </button>
            <button 
              className="material-symbols-outlined text-white hover:text-primary transition-colors"
              onClick={() => handleMonthChange(1)}
            >
              chevron_right
            </button>
          </div>
        </div>

        <div className="calendar-weekdays-grid mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="text-[10px] font-bold text-muted" style={{ color: i === 0 ? 'var(--error)' : i === 6 ? 'var(--primary)' : '' }}>
              {d}
            </div>
          ))}
        </div>

        <div className="calendar-days-grid">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateObj = new Date(year, month, day);
            const dateStr = formatDate(dateObj);
            const isSelected = selectedDate === dateStr;
            const isToday = todayStr === dateStr;
            const dow = dateObj.getDay();

            return (
              <div
                key={day}
                onClick={() => {
                  onSelect(dateStr);
                  onClose();
                }}
                className={`flex items-center justify-center aspect-square rounded-full cursor-pointer text-sm font-bold transition-all
                  ${isSelected ? 'bg-primary text-white scale-110 shadow-lg' : 'hover:bg-white/10'}
                  ${isToday && !isSelected ? 'border border-primary/50' : ''}
                `}
                style={{ 
                  color: isSelected ? '#fff' : (dow === 0 ? 'var(--error)' : dow === 6 ? 'var(--primary)' : 'var(--text-main)')
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-4 py-2 text-xs font-black text-muted hover:text-white uppercase tracking-widest"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

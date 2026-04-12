import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedTime: string; // HH:mm
  onSelect: (time: string) => void;
}

export default function TimePicker({ isOpen, onClose, selectedTime, onSelect }: Props) {
  const initialTime = selectedTime || '12:00';
  const [hour, setHour] = useState(parseInt(initialTime.split(':')[0]));
  const [minute, setMinute] = useState(parseInt(initialTime.split(':')[1]));

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5분 단위

  const handleConfirm = () => {
    const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onSelect(formatted);
    onClose();
  };

  return (
    <div 
      className="modal-overlay active" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 1100 }}
    >
      <div 
        className="modal-container p-6" 
        style={{ maxWidth: '320px', backgroundColor: 'var(--surface-container-highest)' }}
      >
        <h3 className="font-headline text-xl font-bold tracking-tight mb-6 text-center">
          SELECT <span className="text-primary">TIME</span>
        </h3>

        <div className="flex gap-4 items-center justify-center mb-8">
          {/* 시간 */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-muted mb-2 tracking-widest uppercase">HOUR</span>
            <div className="flex flex-col gap-2 overflow-y-auto h-48 w-16 no-scrollbar snap-y snap-mandatory bg-black/20 rounded-xl py-2">
              {hours.map((h) => (
                <button
                  key={h}
                  onClick={() => setHour(h)}
                  className={`flex-shrink-0 h-10 w-full flex items-center justify-center font-bold text-lg snap-center transition-all ${hour === h ? 'text-primary scale-125' : 'text-muted'}`}
                >
                  {h.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <span className="text-2xl font-black text-white mt-6">:</span>

          {/* 분 */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-muted mb-2 tracking-widest uppercase">MIN</span>
            <div className="flex flex-col gap-2 overflow-y-auto h-48 w-16 no-scrollbar snap-y snap-mandatory bg-black/20 rounded-xl py-2">
              {minutes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMinute(m)}
                  className={`flex-shrink-0 h-10 w-full flex items-center justify-center font-bold text-lg snap-center transition-all ${minute === m ? 'text-primary scale-125' : 'text-muted'}`}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="secondary-btn flex-1 py-3 text-xs font-black">CANCEL</button>
          <button onClick={handleConfirm} className="primary-btn flex-1 py-3 text-xs font-black">CONFIRM</button>
        </div>
      </div>
    </div>
  );
}

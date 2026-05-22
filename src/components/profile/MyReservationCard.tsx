import { memo } from 'react';
import { diffDaysBetween } from '../../utils/dateLabels';
import { normalizeTime } from '../../utils/time';
import type { MyReservation } from '../../types';

type ScheduleTab = 'upcoming' | 'history';

interface Props {
  reservation: MyReservation;
  scheduleTab: ScheduleTab;
  today: string;
  canManage: boolean;
  isHostMutating: boolean;
  isLeaveMutating: boolean;
  onEdit: (reservation: MyReservation) => void;
  onDelete: (id: string, teamName: string) => void;
  onLeave: (id: string, teamName: string) => void;
}

function MyReservationCardComponent({
  reservation: res,
  scheduleTab,
  today,
  canManage,
  isHostMutating,
  isLeaveMutating,
  onEdit,
  onDelete,
  onLeave,
}: Props) {
  const rawDiff = diffDaysBetween(res.date, today);
  const diffDays = scheduleTab === 'upcoming' ? rawDiff : -rawDiff;
  const isDday = scheduleTab === 'upcoming' && diffDays === 0;
  const d = new Date(`${res.date}T00:00:00`);

  return (
    <div
      className={`surface-card p-5 flex items-center gap-4 transition-all ${isDday ? 'border-primary/40 bg-primary/5 shadow-[0_4px_20px_rgba(0,100,255,0.08)]' : ''}`}
    >
      <div
        className="flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-full border flex-shrink-0"
        style={isDday
          ? { backgroundColor: 'var(--club-tag-bg)', borderColor: 'var(--primary-border)' }
          : { backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-border)' }
        }
      >
        {isDday ? (
          <div className="flex flex-col items-center">
            <span className="font-black text-xl tracking-tighter text-primary leading-none">D-</span>
            <span className="font-black text-sm tracking-tighter text-primary leading-none uppercase">Day</span>
          </div>
        ) : (
          <span className="font-black text-2xl tracking-tighter text-on-surface-variant">
            {scheduleTab === 'upcoming' ? `D-${diffDays}` : `D+${diffDays}`}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none">
            {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${res.purpose === '합주' ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {res.purpose}
          </span>
        </div>
        <p className="text-lg font-black text-on-surface tracking-tight leading-none mb-1.5 truncate">
          {normalizeTime(res.start_time)} - {normalizeTime(res.end_time)}
        </p>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <p className="font-headline font-bold text-base text-on-surface/80 truncate leading-none">{res.team_name}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0 ml-auto pl-2">
        {canManage ? (
          <>
            <button
              onClick={() => onEdit(res)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
            <button
              onClick={() => onDelete(res.id, res.team_name)}
              disabled={isHostMutating}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => onLeave(res.id, res.team_name)}
            disabled={isLeaveMutating}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        )}
      </div>
    </div>
  );
}

export const MyReservationCard = memo(MyReservationCardComponent);

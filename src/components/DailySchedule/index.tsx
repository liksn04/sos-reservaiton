import { formatDate, normalizeTime } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentUserId: string;
  onEdit: (res: ReservationWithDetails) => void;
  onDelete: (id: string, teamName: string) => void;
}

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

  return (
    <div className="flex flex-col gap-3 animate-slide-up">
      {dayRes.length === 0 ? (
        <div className="glass-card rounded-[2rem] flex flex-col items-center justify-center p-12 opacity-60 border border-outline-variant/10">
          <span className="material-symbols-outlined text-4xl mb-3 text-on-surface-variant/40">event_busy</span>
          <p className="text-on-surface-variant text-sm font-medium">이 날은 예정된 합주가 없습니다.</p>
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
            <div key={res.id} className={`glass-card rounded-3xl p-4 flex items-center gap-4 border transition-all ${isHost ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/10'}`}>
              
              {/* Left: Time Column */}
              <div className="flex flex-col items-center justify-center min-w-[64px] py-1 border-r border-outline-variant/20 pr-4">
                <span className={`text-lg font-black italic tracking-tighter leading-none ${isHost ? 'text-primary' : 'text-on-surface'}`}>
                  {start}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant/50 my-1 italic lowercase">to</span>
                <span className={`text-base font-black italic tracking-tighter leading-none ${isHost ? 'text-primary/70' : 'text-on-surface-variant'}`}>
                  {end}
                </span>
              </div>

              {/* Middle: Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${res.purpose === '합주' ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {res.purpose}
                  </span>
                  {isHost && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-primary/20 text-primary">
                      HOST
                    </span>
                  )}
                  {isInvitee && !isHost && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-secondary/20 text-secondary">
                      INVITED
                    </span>
                  )}
                </div>
                
                <h4 className="text-lg font-black italic tracking-tight text-on-surface truncate mb-1">
                  {res.team_name}
                </h4>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    <span className="truncate max-w-[80px]">{res.host?.display_name ?? 'Unknown'}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
                  <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[14px]">groups</span>
                    <span>{res.people_count}명</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              {isHost && (
                <div className="flex flex-col gap-1.5 ml-auto pl-2">
                  <button 
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant" 
                    onClick={() => onEdit(res)}
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                  <button 
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant" 
                    onClick={() => onDelete(res.id, res.team_name)}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

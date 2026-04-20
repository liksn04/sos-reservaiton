import { formatDate, normalizeTime, isPastReservation } from '../../utils/time';
import type { ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentUserId: string;
  isAdmin?: boolean;
  onView: (res: ReservationWithDetails) => void;
  onEdit: (res: ReservationWithDetails) => void;
  onDelete: (id: string, teamName: string) => void;
}

export default function DailySchedule({
  reservations,
  selectedDate,
  currentUserId,
  isAdmin = false,
  onView,
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
          const start = normalizeTime(res.start_time);
          const end = normalizeTime(res.end_time);
          
          const isHost = res.host_id === currentUserId;
          const isInvitee = res.reservation_invitees?.some(
            (inv) => inv.user_id === currentUserId,
          );

          const isPast = isPastReservation(res.date, end, res.is_next_day);
          // 호스트는 미래 일정만 가능, 관리자는 과거 일정도 가능
          const isEditable = (isHost && !isPast) || isAdmin;

          return (
            <div
              key={res.id}
              className={`surface-card p-4 flex items-center gap-4 transition-all ${isHost ? 'bg-primary/5 border-primary/20' : ''}`}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`${res.team_name} 예약 상세 보기`}
                className="flex flex-1 min-w-0 items-center gap-4 pr-1 cursor-pointer rounded-[1.25rem] transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                onClick={() => onView(res)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onView(res);
                  }
                }}
              >
                {/* Left: Time Column */}
                <div className="flex flex-col items-center justify-center min-w-[74px] py-3 rounded-[1.5rem] bg-surface-container-low">
                  <span className={`text-lg font-black tracking-tighter leading-none ${isHost ? 'text-primary' : 'text-on-surface'}`}>
                    {start}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant/50 my-1 lowercase">to</span>
                  <span className={`text-base font-black tracking-tighter leading-none ${isHost ? 'text-primary/70' : 'text-on-surface-variant'}`}>
                    {end}
                  </span>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                      style={res.purpose === '합주'
                        ? { backgroundColor: 'var(--club-tag-bg)', color: 'var(--primary)' }
                        : { backgroundColor: 'var(--surface-container)', color: 'var(--text-muted)' }
                      }
                    >
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
                    {!isHost && isAdmin && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-orange-500/20 text-orange-500">
                        ADMIN
                      </span>
                    )}
                  </div>

                  <h4 className="font-headline text-lg font-bold tracking-tight text-on-surface truncate mb-1">
                    {res.team_name}
                  </h4>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      <span className="truncate max-w-[80px]">{res.host?.display_name ?? '알 수 없음'}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
                    <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      <span>{res.people_count}명</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              {isEditable && (
                <div className="flex flex-col gap-2 ml-auto pl-2">
                  <button
                    title="수정"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-surface-container-low text-on-surface-variant border border-card-border hover:border-primary/50 hover:text-primary hover:bg-surface-highest shadow-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(res);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                  <button
                    title="삭제"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-surface-container-low text-on-surface-variant border border-card-border hover:border-error/50 hover:text-error hover:bg-error/5 shadow-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(res.id, res.team_name);
                    }}
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

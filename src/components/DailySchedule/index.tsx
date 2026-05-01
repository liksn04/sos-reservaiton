import type { CSSProperties } from 'react';
import { formatDate, normalizeTime, isPastReservation } from '../../utils/time';
import type { Purpose, ReservationWithDetails } from '../../types';

interface Props {
  reservations: ReservationWithDetails[];
  selectedDate: Date;
  currentUserId: string;
  isAdmin?: boolean;
  onView: (res: ReservationWithDetails) => void;
  onEdit: (res: ReservationWithDetails) => void;
  onDelete: (id: string, teamName: string) => void;
}

interface PurposeTone {
  accent: string;
  text: string;
  tint: string;
  tintStrong: string;
  border: string;
  shadow: string;
}

const PURPOSE_TONES: Record<Purpose, PurposeTone> = {
  합주: {
    accent: '#0064ff',
    text: '#004ecb',
    tint: 'rgba(0, 100, 255, 0.08)',
    tintStrong: 'rgba(0, 100, 255, 0.16)',
    border: 'rgba(0, 100, 255, 0.22)',
    shadow: 'rgba(0, 100, 255, 0.10)',
  },
  오디션: {
    accent: '#8b5cf6',
    text: '#6d28d9',
    tint: 'rgba(139, 92, 246, 0.09)',
    tintStrong: 'rgba(139, 92, 246, 0.18)',
    border: 'rgba(139, 92, 246, 0.24)',
    shadow: 'rgba(139, 92, 246, 0.10)',
  },
  강습: {
    accent: '#0f9f7a',
    text: '#047857',
    tint: 'rgba(15, 159, 122, 0.09)',
    tintStrong: 'rgba(15, 159, 122, 0.18)',
    border: 'rgba(15, 159, 122, 0.24)',
    shadow: 'rgba(15, 159, 122, 0.10)',
  },
  정기회의: {
    accent: '#d97706',
    text: '#92400e',
    tint: 'rgba(217, 119, 6, 0.09)',
    tintStrong: 'rgba(217, 119, 6, 0.18)',
    border: 'rgba(217, 119, 6, 0.24)',
    shadow: 'rgba(217, 119, 6, 0.10)',
  },
};

function getPurposeTone(purpose: Purpose): PurposeTone {
  return PURPOSE_TONES[purpose] ?? PURPOSE_TONES.합주;
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
          const tone = getPurposeTone(res.purpose);
          const cardStyle = {
            '--reservation-accent': tone.accent,
            '--reservation-text': tone.text,
            '--reservation-tint': tone.tint,
            '--reservation-tint-strong': tone.tintStrong,
            '--reservation-border': tone.border,
            '--reservation-shadow': tone.shadow,
            background: `linear-gradient(135deg, ${tone.tint} 0%, rgb(var(--color-surface-container-lowest)) 68%)`,
            borderColor: tone.border,
            boxShadow: `0 16px 34px ${tone.shadow}`,
          } as CSSProperties;
          
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
              className="surface-card group relative overflow-hidden p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5"
              style={cardStyle}
            >
              <span
                className="absolute inset-y-5 left-0 w-1.5 rounded-r-full"
                style={{ backgroundColor: tone.accent }}
                aria-hidden="true"
              />
              <div
                role="button"
                tabIndex={0}
                aria-label={`${res.team_name} 예약 상세 보기`}
                className="flex flex-1 min-w-0 items-center gap-4 pr-1 cursor-pointer rounded-[1.25rem] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                onClick={() => onView(res)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onView(res);
                  }
                }}
              >
                {/* Left: Time Column */}
                <div
                  className="flex flex-col items-center justify-center min-w-[74px] py-3 rounded-[1.5rem] border"
                  style={{ backgroundColor: tone.tintStrong, borderColor: tone.border }}
                >
                  <span className="text-lg font-black tracking-tighter leading-none" style={{ color: tone.text }}>
                    {start}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant/50 my-1 lowercase">to</span>
                  <span className="text-base font-black tracking-tighter leading-none" style={{ color: tone.text }}>
                    {end}
                  </span>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border"
                      style={{ backgroundColor: tone.tintStrong, borderColor: tone.border, color: tone.text }}
                    >
                      {res.purpose}
                    </span>
                    {isHost && (
                      <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/15">
                        내 예약
                      </span>
                    )}
                    {isInvitee && !isHost && (
                      <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-secondary/15 text-secondary border border-secondary/15">
                        초대됨
                      </span>
                    )}
                    {!isHost && isAdmin && (
                      <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 border border-orange-500/15">
                        ADMIN
                      </span>
                    )}
                  </div>

                  <h4 className="font-headline text-lg font-extrabold tracking-tight text-on-surface truncate mb-1">
                    {res.team_name}
                  </h4>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      <span className="truncate max-w-[80px]">{res.host?.display_name ?? '알 수 없음'}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: tone.border }}></div>
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

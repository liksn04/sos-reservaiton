import { memo } from 'react';
import type { ClubEventWithDetails } from '../../types';
import { diffDaysBetween, formatKoreanDate } from '../../utils/dateLabels';

type Tab = 'upcoming' | 'past' | 'timeline';

interface EventCardProps {
  event: ClubEventWithDetails;
  today: string;
  tab: Tab;
  isAdmin: boolean;
  isJoinPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewParticipants: () => void;
  onJoinToggle: () => void;
}

function EventCardComponent({
  event,
  today,
  tab,
  isAdmin,
  isJoinPending,
  onEdit,
  onDelete,
  onViewParticipants,
  onJoinToggle,
}: EventCardProps) {
  const summary = event.participantSummary ?? {
    eventId: event.id,
    participantCount: 0,
    viewerJoined: false,
    hasExactParticipantCount: false,
  };
  const isJoined = summary.viewerJoined;
  const dDays = diffDaysBetween(event.start_date, today);
  const isDday = tab === 'upcoming' && dDays === 0;
  const cat = event.category;
  const dDayLabel = tab === 'upcoming' ? `D-${Math.max(dDays, 0)}` : `D+${Math.abs(dDays)}`;
  const participantLabel = summary.hasExactParticipantCount
    ? `${summary.participantCount}명 참여 중`
    : summary.viewerJoined
      ? '내 참여 상태: 참여 중'
      : '참여 상태 보기';

  return (
    <div
      className="surface-card p-6 transition-all hover:translate-y-[-2px] group relative overflow-hidden"
      style={{
        borderColor: isDday ? (cat?.color ?? 'var(--primary)') : 'var(--card-border)',
        backgroundColor: isDday ? `${cat?.color ?? '#cc97ff'}15` : undefined,
        boxShadow: isDday ? `0 8px 30px ${cat?.color ?? '#cc97ff'}18` : undefined,
      }}
    >
      <div className="absolute top-4 right-5 text-[3rem] font-headline font-bold tracking-[-0.08em] select-none opacity-5" style={{ color: cat?.color ?? 'var(--primary)' }}>
        {dDayLabel}
      </div>

      <div className="relative z-10">
        <div
          className="sm:hidden absolute top-0 right-0 flex items-center justify-center min-w-[78px] h-[40px] px-3 rounded-full border"
          style={{
            backgroundColor: cat ? `${cat.color}14` : 'var(--surface-container)',
            borderColor: cat?.color ?? 'var(--outline-border)',
            color: cat?.color ?? 'var(--primary)',
          }}
        >
          <span className="font-black text-base tracking-tighter">{dDayLabel}</span>
        </div>

        <div className="flex items-start gap-4 pr-[92px] sm:pr-0">
          <div
            className="w-24 h-24 rounded-[1.75rem] flex-shrink-0 flex flex-col items-start justify-end p-4 text-white shadow-lg"
            style={{
              background: cat
                ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}CC 100%)`
                : 'var(--primary-btn-gradient)',
            }}
          >
            <span className="material-symbols-outlined text-[28px] mb-2">{cat?.icon ?? 'event'}</span>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase">{cat?.name ?? 'Event'}</span>
          </div>

          <div
            className="hidden sm:flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl border flex-shrink-0"
            style={{
              backgroundColor: cat ? `${cat.color}1A` : 'var(--surface-container)',
              borderColor: cat?.color ?? 'var(--outline-border)',
            }}
          >
            {isDday ? (
              <>
                <span className="font-black text-xl tracking-tighter leading-none" style={{ color: cat?.color ?? 'var(--primary)' }}>D-</span>
                <span className="font-black text-sm tracking-tighter leading-none uppercase" style={{ color: cat?.color ?? 'var(--primary)' }}>Day</span>
              </>
            ) : (
              <span className="font-black text-2xl tracking-tighter" style={{ color: cat?.color ?? 'var(--text-on-surface-var)' }}>
                {dDayLabel}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {cat && (
                <span
                  className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                  {cat.name}
                </span>
              )}
              {!event.is_public && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-500">
                  비공개
                </span>
              )}
            </div>
            <h3 className="font-headline text-[1.4rem] font-bold tracking-tight text-on-surface mb-2 leading-tight">{event.title}</h3>

            <div className="space-y-1">
              <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatKoreanDate(event.start_date)}
                {event.start_time && ` ${event.start_time.slice(0, 5)}`}
                {event.end_date && event.end_date !== event.start_date && ` ~ ${formatKoreanDate(event.end_date)}`}
              </p>
              {event.location && (
                <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">place</span>
                  {event.location}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer group min-w-0" onClick={onViewParticipants}>
            <div className="flex h-8 min-w-[44px] items-center justify-center rounded-full border border-card-border bg-surface-container px-3">
              <span className="material-symbols-outlined text-[15px] text-primary">group</span>
            </div>
            <span className="text-[10px] font-black text-muted group-hover:text-primary transition-colors whitespace-nowrap">
              {participantLabel}
            </span>
          </div>

          {tab === 'upcoming' && (
            <button
              onClick={onJoinToggle}
              disabled={isJoinPending}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm sm:ml-auto"
              style={{
                backgroundColor: isJoined ? `${cat?.color ?? '#cc97ff'}20` : 'var(--primary)',
                color: isJoined ? (cat?.color ?? 'var(--primary)') : 'var(--on-primary)',
                border: isJoined ? `1px solid ${cat?.color ?? '#cc97ff'}40` : 'none',
              }}
            >
              <span className="material-symbols-outlined text-sm">
                {isJoined ? 'check_circle' : 'add_circle'}
              </span>
              {isJoined ? '참여 완료' : '참여하기'}
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={onEdit}
              title="수정"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container-high text-on-surface-variant border border-card-border hover:border-primary/50 hover:text-primary hover:bg-surface-highest group-hover:shadow-md"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
            <button
              onClick={onDelete}
              title="삭제"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container-high text-on-surface-variant border border-card-border hover:border-error/50 hover:text-error hover:bg-error/5 group-hover:shadow-md"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const EventCard = memo(EventCardComponent);

import type { ReservationWithDetails } from '../types';
import {
  buildReservationParticipantItems,
  formatReservationDetailDate,
  formatReservationDetailTimeRange,
  getReservationDurationLabel,
} from '../utils/reservationDetails';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationWithDetails | null;
  currentUserId: string;
  isAdmin?: boolean;
}

export default function ReservationDetailModal({
  isOpen,
  onClose,
  reservation,
  currentUserId,
  isAdmin = false,
}: Props) {
  if (!isOpen || !reservation) return null;

  const isHost = reservation.host_id === currentUserId;
  const isInvitee = reservation.reservation_invitees?.some(
    (invitee) => invitee.user_id === currentUserId,
  );
  const participants = buildReservationParticipantItems(reservation);
  const knownInvitees = participants.filter((participant) => participant.role === 'invitee');
  const createdAtLabel = new Date(reservation.created_at).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="modal-overlay active reservation-detail-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container reservation-detail-container"
        style={{ maxWidth: 560 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-detail-title"
      >
        <div className="reservation-detail-handle" aria-hidden="true" />

        <div className="modal-header reservation-detail-header">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                style={reservation.purpose === '합주'
                  ? { backgroundColor: 'var(--club-tag-bg)', color: 'var(--primary)' }
                  : { backgroundColor: 'var(--surface-container)', color: 'var(--text-muted)' }
                }
              >
                {reservation.purpose}
              </span>
              {reservation.is_next_day && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-secondary/15 text-secondary">
                  익일 종료
                </span>
              )}
              {isHost && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-primary/20 text-primary">
                  HOST
                </span>
              )}
              {isInvitee && !isHost && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-secondary/20 text-secondary">
                  INVITED
                </span>
              )}
              {!isHost && isAdmin && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-orange-500/20 text-orange-500">
                  ADMIN
                </span>
              )}
            </div>
            <h2
              id="reservation-detail-title"
              className="font-headline text-[1.9rem] sm:text-2xl font-bold tracking-tight text-on-surface break-words leading-[1.05]"
            >
              {reservation.team_name}
            </h2>
          </div>

          <button
            type="button"
            aria-label="상세정보 닫기"
            className="material-symbols-outlined text-2xl text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 w-11 h-11 rounded-full border border-card-border bg-surface-container-low flex items-center justify-center"
            onClick={onClose}
          >
            close
          </button>
        </div>

        <div className="modal-body reservation-detail-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <InfoCard
              icon="calendar_month"
              label="예약 날짜"
              value={formatReservationDetailDate(reservation.date)}
            />
            <InfoCard
              icon="schedule"
              label="예약 시간"
              value={formatReservationDetailTimeRange(reservation)}
              subValue={getReservationDurationLabel(reservation)}
            />
          </div>

          <div className="rounded-[1.5rem] border border-card-border bg-surface-container-low px-4 py-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {reservation.host?.avatar_url ? (
                <img
                  src={reservation.host.avatar_url}
                  alt={reservation.host.display_name}
                  className="w-12 h-12 rounded-full object-cover border border-card-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-sm font-black text-on-surface border border-card-border">
                  {(reservation.host?.display_name ?? '알').slice(0, 1)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                  예약자
                </p>
                <p className="font-headline text-lg font-bold tracking-tight text-on-surface truncate">
                  {reservation.host?.display_name ?? '알 수 없는 예약자'}
                </p>
              </div>

              <div className="rounded-[1.25rem] bg-surface px-4 py-3 border border-card-border text-left sm:text-right w-full sm:w-auto">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70">
                  예정 인원
                </p>
                <p className="font-headline text-xl font-bold tracking-tight text-primary">
                  {reservation.people_count}명
                </p>
              </div>
            </div>
          </div>

          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-3">
              <h3 className="font-headline text-lg font-bold tracking-tight text-on-surface">
                참여 명단
              </h3>
              <span className="text-xs font-bold text-on-surface-variant">
                확인 가능한 멤버 {participants.length}명
              </span>
            </div>

            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-[1.25rem] border border-card-border bg-surface-container-low px-4 py-3 flex items-center gap-3"
                >
                  {participant.avatarUrl ? (
                    <img
                      src={participant.avatarUrl}
                      alt={participant.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-card-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-sm font-black text-on-surface border border-card-border">
                      {participant.displayName.slice(0, 1)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {participant.displayName}
                    </p>
                    <p className="text-[11px] font-medium text-on-surface-variant">
                      {participant.role === 'host' ? '예약 생성자' : '초대된 멤버'}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                        participant.role === 'host'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-surface text-on-surface-variant'
                      }`}
                    >
                      {participant.role === 'host' ? 'HOST' : 'INVITED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {knownInvitees.length === 0 && (
              <p className="mt-3 text-xs font-medium text-on-surface-variant">
                초대된 멤버 정보가 아직 등록되지 않았거나, 현재 계정에서 확인 가능한 정보만 표시되고 있습니다.
              </p>
            )}
          </section>

          <div className="rounded-[1.5rem] border border-card-border bg-surface-container-low px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70 mb-1">
              예약 생성 시각
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {createdAtLabel}
            </p>
          </div>
        </div>

        <div className="modal-footer reservation-detail-footer">
          <button type="button" className="primary-btn w-full" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
}

function InfoCard({ icon, label, value, subValue }: InfoCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-card-border bg-surface-container-low px-4 py-4 min-w-0">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/70 mb-1">
            {label}
          </p>
          <p className="text-sm font-bold text-on-surface break-words">
            {value}
          </p>
          {subValue && (
            <p className="text-xs font-medium text-on-surface-variant mt-1">
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '../context/AuthContext'
import { useEventParticipants } from '../hooks/useEventParticipants'
import { useMarkAttended } from '../hooks/mutations/useEventParticipantMutations'
import { PART_INFO } from '../lib/constants'
import type { ClubEventWithDetails, Part } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  event: ClubEventWithDetails | null
}

export default function EventParticipantsModal({ isOpen, onClose, event }: Props) {
  const { profile } = useAuth()
  const isAdmin = Boolean(profile?.is_admin)
  const { data: participants = [], isLoading } = useEventParticipants(event?.id ?? '', isAdmin)
  const markAttended = useMarkAttended()

  if (!isOpen || !event) return null

  const participantSummary = event.participantSummary ?? {
    eventId: event.id,
    participantCount: 0,
    viewerJoined: false,
    hasExactParticipantCount: false,
  }
  const attendedCount = participants.filter((participant) => participant.attended).length
  const participantCountLabel = participantSummary.hasExactParticipantCount
    ? String(participantSummary.participantCount)
    : '-'

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-container p-6 rounded-2xl w-full max-w-md border border-white/10"
        style={{
          backgroundColor: 'var(--surface)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-2xl font-bold tracking-tight">
            PARTICIPANTS <span className="text-primary">{participantCountLabel}</span>
          </h2>
          <button
            className="material-symbols-outlined text-muted hover:text-white transition-colors"
            onClick={onClose}
          >
            close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="rounded-xl p-3 text-center border border-white/5"
            style={{ backgroundColor: 'var(--surface-container)' }}
          >
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
              {participantSummary.hasExactParticipantCount ? 'RSVP' : 'STATUS'}
            </p>
            <p className="font-headline text-2xl font-bold mt-1">{participantCountLabel}</p>
          </div>
          <div
            className="rounded-xl p-3 text-center border border-white/5"
            style={{ backgroundColor: 'var(--surface-container)' }}
          >
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
              {isAdmin ? 'ATTENDED' : 'MY STATUS'}
            </p>
            <p className="font-headline text-2xl font-bold mt-1" style={{ color: 'var(--primary)' }}>
              {isAdmin ? attendedCount : participantSummary.viewerJoined ? '참여 중' : '미참여'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {!isAdmin ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5">
              <p className="text-sm font-bold text-on-surface">
                현재 공개 범위에서는 내 참여 여부만 제공됩니다.
              </p>
              <p className="mt-2 text-xs text-muted">
                참가자 총원, 상세 명단, 출석 상태는 관리자 화면에서만 확인할 수 있습니다.
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-10 text-center text-muted font-bold animate-pulse">LOADING...</div>
          ) : participants.length === 0 ? (
            <div className="py-10 text-center text-muted font-bold opacity-50">참가자가 없습니다.</div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-colors"
                style={{ backgroundColor: 'var(--surface-container)' }}
              >
                {participant.profile?.avatar_url ? (
                  <img
                    src={participant.profile.avatar_url}
                    alt={participant.profile?.display_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm text-on-surface ring-2 ring-white/10">
                    {participant.profile?.display_name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">{participant.profile?.display_name}</span>
                    <div className="flex gap-1">
                      {(Array.isArray(participant.profile?.part) ? participant.profile!.part : []).map((part) => (
                        <span
                          key={part}
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm"
                          style={{
                            backgroundColor: `${PART_INFO[part as Part]?.text ?? '#6b7280'}20`,
                            color: PART_INFO[part as Part]?.text ?? '#6b7280',
                            border: `1px solid ${PART_INFO[part as Part]?.text ?? '#6b7280'}40`
                          }}
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted font-medium mt-0.5">
                    {new Date(participant.joined_at).toLocaleDateString()} 신청
                  </p>
                </div>

                <button
                  onClick={() => markAttended.mutate({
                    participantId: participant.id,
                    attended: !participant.attended
                  })}
                  disabled={markAttended.isPending}
                  className="material-symbols-outlined transition-all hover:scale-110"
                  style={{
                    color: participant.attended ? 'var(--primary)' : 'var(--muted)',
                    fontVariationSettings: participant.attended ? "'FILL' 1" : "'FILL' 0",
                    fontSize: '28px'
                  }}
                >
                  {participant.attended ? 'check_circle' : 'radio_button_unchecked'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

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
  const { data: participants = [], isLoading } = useEventParticipants(event?.id ?? '')
  const markAttended = useMarkAttended()

  if (!isOpen || !event) return null

  const attendedCount = participants.filter((p) => p.attended).length

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
            PARTICIPANTS <span className="text-primary">{participants.length}</span>
          </h2>
          <button
            className="material-symbols-outlined text-muted hover:text-white transition-colors"
            onClick={onClose}
          >
            close
          </button>
        </div>

        {/* 출석 통계 (어드민 전용 필드 포함 가능) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className="rounded-xl p-3 text-center border border-white/5"
            style={{ backgroundColor: 'var(--surface-container)' }}
          >
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">RSVP</p>
            <p className="font-headline text-2xl font-bold mt-1">{participants.length}</p>
          </div>
          <div
            className="rounded-xl p-3 text-center border border-white/5"
            style={{ backgroundColor: 'var(--surface-container)' }}
          >
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">ATTENDED</p>
            <p className="font-headline text-2xl font-bold mt-1" style={{ color: 'var(--primary)' }}>
              {attendedCount}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {isLoading ? (
            <div className="py-10 text-center text-muted font-bold animate-pulse">LOADING...</div>
          ) : participants.length === 0 ? (
            <div className="py-10 text-center text-muted font-bold opacity-50">상대방이 없습니다.</div>
          ) : (
            participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-colors"
                style={{ backgroundColor: 'var(--surface-container)' }}
              >
                {p.profile?.avatar_url ? (
                  <img
                    src={p.profile.avatar_url}
                    alt={p.profile?.display_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm text-on-surface ring-2 ring-white/10">
                    {p.profile?.display_name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">{p.profile?.display_name}</span>
                    <div className="flex gap-1">
                      {(Array.isArray(p.profile?.part) ? p.profile!.part : []).map((part) => (
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
                    {new Date(p.joined_at).toLocaleDateString()} 신청
                  </p>
                </div>

                {/* 출석 체크 (어드민만 제어 가능, 일반 유저는 상태 표시만) */}
                {profile?.is_admin ? (
                  <button
                    onClick={() => markAttended.mutate({ 
                      participantId: p.id, 
                      attended: !p.attended
                    })}
                    disabled={markAttended.isPending}
                    className="material-symbols-outlined transition-all hover:scale-110"
                    style={{ 
                      color: p.attended ? 'var(--primary)' : 'var(--muted)',
                      fontVariationSettings: p.attended ? "'FILL' 1" : "'FILL' 0",
                      fontSize: '28px'
                    }}
                  >
                    {p.attended ? 'check_circle' : 'radio_button_unchecked'}
                  </button>
                ) : (
                  p.attended && (
                    <span 
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1", fontSize: '24px' }}
                    >
                      check_circle
                    </span>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

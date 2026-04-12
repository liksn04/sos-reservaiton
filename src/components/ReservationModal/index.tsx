import { useMembers } from '../../hooks/useMembers';
import { useReservationForm } from './useReservationForm';
import ReservationFormFields from './ReservationFormFields';
import type { Profile, ReservationWithDetails } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  editing: ReservationWithDetails | null;
  reservations: ReservationWithDetails[];
  currentUserId: string;
}

export default function ReservationModal({
  isOpen,
  onClose,
  initialDate,
  editing,
  reservations,
  currentUserId,
}: Props) {
  const { data: members = [] } = useMembers();

  if (!isOpen) return null;

  const formKey = editing?.id ?? `new-${initialDate.toISOString()}`;

  return (
    <ReservationModalContent
      key={formKey}
      onClose={onClose}
      initialDate={initialDate}
      editing={editing}
      reservations={reservations}
      currentUserId={currentUserId}
      members={members}
    />
  );
}

function ReservationModalContent({
  onClose,
  initialDate,
  editing,
  reservations,
  currentUserId,
  members,
}: Omit<Props, 'isOpen'> & { members: Profile[] }) {
  const {
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    teamName, setTeamName,
    peopleCount, setPeopleCount,
    purpose, setPurpose,
    invitees, setInvitees,
    error,
    submitting,
    handleSubmit,
  } = useReservationForm({ editing, initialDate, reservations, currentUserId, onClose });

  const isEditing = !!editing;

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-container flex flex-col max-h-[90vh] overflow-hidden">
        <div className="modal-header flex-shrink-0">
          <h2 className="font-headline text-2xl font-bold tracking-tight">
            {isEditing ? '예약' : '새로운'} <span className="text-primary">{isEditing ? '수정' : '예약'}</span>
          </h2>
          <button
            type="button"
            className="material-symbols-outlined text-2xl text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="modal-body flex-1 overflow-y-auto px-6 py-4">
            <ReservationFormFields
              date={date}                   onDateChange={setDate}
              startTime={startTime}         endTime={endTime}
              onStartChange={setStartTime}  onEndChange={setEndTime}
              reservations={reservations}   editingId={editing?.id ?? null}
              teamName={teamName}           onTeamNameChange={setTeamName}
              peopleCount={peopleCount}     onPeopleCountChange={setPeopleCount}
              purpose={purpose}             onPurposeChange={setPurpose}
              invitees={invitees}           onInviteesChange={setInvitees}
              members={members}             currentUserId={currentUserId}
            />

            {error && (
              <p className="form-error mt-4">
                {error}
              </p>
            )}
          </div>

          <div className="modal-footer flex-shrink-0 px-6 py-6 border-t border-card-border bg-surface-container-high/50">
            <div className="form-actions !mt-0 w-full">
              <button type="button" className="secondary-btn" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting
                  ? (isEditing ? '저장 중...' : '예약 진행 중...')
                  : (isEditing ? '변경사항 저장' : '예약 확정하기')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

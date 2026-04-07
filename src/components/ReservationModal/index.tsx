import { useMembers } from '../../hooks/useMembers';
import { useReservationForm } from './useReservationForm';
import ReservationFormFields from './ReservationFormFields';
import type { ReservationWithDetails } from '../../types';

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
  } = useReservationForm({ isOpen, editing, initialDate, reservations, currentUserId, onClose });

  if (!isOpen) return null;

  const isEditing = !!editing;

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="text-2xl font-black italic tracking-tighter">
            {isEditing ? '예약' : '새로운'} <span className="text-primary">{isEditing ? '수정' : '예약'}</span>
          </h2>
          <button
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onClose}
            style={{ fontSize: '24px' }}
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            <p className="form-error">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting
                ? (isEditing ? '저장 중...' : '예약 진행 중...')
                : (isEditing ? '변경사항 저장' : '예약 확정하기')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useCreateReservation, useUpdateReservation } from '../../hooks/mutations/useReservationMutations';
import { useToast } from '../../contexts/useToast';
import { validatePurposeAccessPolicy, validateReservationTime } from '../../utils/validation';
import { formatDate, normalizeTime } from '../../utils/time';
import type { ReservationPolicySeason, ReservationWithDetails, Purpose } from '../../types';

const DEFAULT_START = '10:00';

function getDefaultEndTime(startTime: string): string {
  const [hours, minutes] = normalizeTime(startTime).split(':').map(Number);
  const endHours = Math.min(hours + 1, 24);
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

interface UseReservationFormOptions {
  editing: ReservationWithDetails | null;
  initialDate: Date;
  initialStartTime?: string;
  reservations: ReservationWithDetails[];
  currentUserId: string;
  onClose: () => void;
  policySeasons: ReservationPolicySeason[];
  isAdmin: boolean;
}

export function useReservationForm({
  editing,
  initialDate,
  initialStartTime,
  reservations,
  currentUserId,
  onClose,
  policySeasons,
  isAdmin,
}: UseReservationFormOptions) {
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const initialDateValue = editing?.date ?? formatDate(initialDate);
  const normalizedInitialStart = normalizeTime(initialStartTime ?? DEFAULT_START);
  const initialStartValue = editing ? normalizeTime(editing.start_time) : normalizedInitialStart;
  const initialEndValue = editing ? normalizeTime(editing.end_time) : getDefaultEndTime(normalizedInitialStart);
  const initialTeamName = editing?.team_name ?? '';
  const initialPeopleCount = editing?.people_count ?? 1;
  const initialPurpose = editing?.purpose ?? '합주';
  const initialInvitees = editing?.reservation_invitees?.map((invitee) => invitee.user_id) ?? [];

  const [date, setDate]               = useState(initialDateValue);
  const [startTime, setStartTime]     = useState(initialStartValue);
  const [endTime, setEndTime]         = useState(initialEndValue);
  const [teamName, setTeamName]       = useState(initialTeamName);
  const [peopleCount, setPeopleCount] = useState(initialPeopleCount);
  const [purpose, setPurpose]         = useState<Purpose>(initialPurpose);
  const [invitees, setInvitees]       = useState<string[]>(initialInvitees);
  const [error, setError]             = useState('');
  const { addToast }                  = useToast();

  const submitting = createReservation.isPending || updateReservation.isPending;

  // Escape 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const purposeAccessError = validatePurposeAccessPolicy(purpose, isAdmin);
    if (purposeAccessError) {
      setError(purposeAccessError.message);
      addToast(purposeAccessError.message, 'error');
      return;
    }

    const validationError = validateReservationTime(
      date,
      startTime,
      endTime,
      reservations,
      editing?.id ?? null,
      purpose,
      policySeasons,
      undefined,
      teamName,
    );
    if (validationError) {
      setError(validationError.message);
      addToast(validationError.message, 'error');
      return;
    }

    try {
      if (editing) {
        await updateReservation.mutateAsync({
          id: editing.id,
          date, startTime, endTime,
          teamName, peopleCount, purpose, invitees,
        });
        addToast('예약이 성공적으로 수정되었습니다.', 'success');
      } else {
        await createReservation.mutateAsync({
          hostId: currentUserId,
          date, startTime, endTime,
          teamName, peopleCount, purpose, invitees,
        });
        addToast('성공적으로 예약되었습니다!', 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String(err.message)
            : '저장에 실패했습니다. 네트워크 연결을 확인해주세요.';
      setError(msg);
      addToast(msg, 'error');
    }
  }

  return {
    // 필드 값
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    teamName, setTeamName,
    peopleCount, setPeopleCount,
    purpose, setPurpose,
    invitees, setInvitees,
    // 제출 상태
    error,
    submitting,
    handleSubmit,
  };
}

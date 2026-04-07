import { useState, useEffect } from 'react';
import { useCreateReservation, useUpdateReservation } from '../../hooks/mutations/useReservationMutations';
import { validateReservationTime } from '../../utils/validation';
import { formatDate, normalizeTime } from '../../utils/time';
import type { ReservationWithDetails, Purpose } from '../../types';

const DEFAULT_START = '10:00';
const DEFAULT_END = '11:00';

interface UseReservationFormOptions {
  isOpen: boolean;
  editing: ReservationWithDetails | null;
  initialDate: Date;
  reservations: ReservationWithDetails[];
  currentUserId: string;
  onClose: () => void;
}

export function useReservationForm({
  isOpen,
  editing,
  initialDate,
  reservations,
  currentUserId,
  onClose,
}: UseReservationFormOptions) {
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const [date, setDate]               = useState(formatDate(initialDate));
  const [startTime, setStartTime]     = useState(DEFAULT_START);
  const [endTime, setEndTime]         = useState(DEFAULT_END);
  const [teamName, setTeamName]       = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [purpose, setPurpose]         = useState<Purpose>('합주');
  const [invitees, setInvitees]       = useState<string[]>([]);
  const [error, setError]             = useState('');

  const submitting = createReservation.isPending || updateReservation.isPending;

  // 모달 열릴 때 폼 초기화
  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setDate(editing.date);
      setStartTime(normalizeTime(editing.start_time));
      setEndTime(normalizeTime(editing.end_time));
      setTeamName(editing.team_name);
      setPeopleCount(editing.people_count);
      setPurpose(editing.purpose);
      setInvitees(editing.reservation_invitees?.map((i) => i.user_id) ?? []);
    } else {
      setDate(formatDate(initialDate));
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      setTeamName('');
      setPeopleCount(1);
      setPurpose('합주');
      setInvitees([]);
    }
    setError('');
  }, [isOpen, editing, initialDate]);

  // Escape 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateReservationTime(
      date, startTime, endTime, reservations, editing?.id ?? null,
    );
    if (validationError) {
      setError(validationError.message);
      return;
    }

    try {
      if (editing) {
        await updateReservation.mutateAsync({
          id: editing.id,
          date, startTime, endTime,
          teamName, peopleCount, purpose, invitees,
        });
      } else {
        await createReservation.mutateAsync({
          hostId: currentUserId,
          date, startTime, endTime,
          teamName, peopleCount, purpose, invitees,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
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

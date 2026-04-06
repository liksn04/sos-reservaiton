import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useMembers } from '../../hooks/useMembers';
import { validateReservationTime, computeIsNextDay } from '../../utils/validation';
import { formatDate, normalizeTime } from '../../utils/time';
import TimeSlotPicker from './TimeSlotPicker';
import InviteePicker from './InviteePicker';
import type { ReservationWithDetails, Purpose } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  editing: ReservationWithDetails | null;
  reservations: ReservationWithDetails[];
  currentUserId: string;
}

const PURPOSES: Purpose[] = ['합주', '강습', '정기회의'];

const DEFAULT_START = '10:00';
const DEFAULT_END = '11:00';

export default function ReservationModal({
  isOpen,
  onClose,
  initialDate,
  editing,
  reservations,
  currentUserId,
}: Props) {
  const queryClient = useQueryClient();
  const { data: members = [] } = useMembers();

  // Form state
  const [date, setDate] = useState(formatDate(initialDate));
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [teamName, setTeamName] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [purpose, setPurpose] = useState<Purpose>('합주');
  const [invitees, setInvitees] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      date,
      startTime,
      endTime,
      reservations,
      editing?.id ?? null,
    );
    if (validationError) {
      setError(validationError.message);
      return;
    }

    setSubmitting(true);
    try {
      const isNextDay = computeIsNextDay(startTime, endTime);

      if (editing) {
        // 수정
        const { error: updateErr } = await supabase
          .from('reservations')
          .update({
            date,
            start_time: startTime,
            end_time: endTime,
            is_next_day: isNextDay,
            team_name: teamName,
            people_count: peopleCount,
            purpose,
          })
          .eq('id', editing.id);
        if (updateErr) throw updateErr;

        // 합주면 초대 목록 교체
        if (purpose === '합주') {
          await supabase
            .from('reservation_invitees')
            .delete()
            .eq('reservation_id', editing.id);

          if (invitees.length > 0) {
            await supabase.from('reservation_invitees').insert(
              invitees.map((uid) => ({ reservation_id: editing.id, user_id: uid })),
            );
          }
        } else {
          // 합주 아닌 목적으로 변경 시 기존 초대 전부 삭제
          await supabase
            .from('reservation_invitees')
            .delete()
            .eq('reservation_id', editing.id);
        }
      } else {
        // 신규
        const { data: newRes, error: insertErr } = await supabase
          .from('reservations')
          .insert({
            host_id: currentUserId,
            date,
            start_time: startTime,
            end_time: endTime,
            is_next_day: isNextDay,
            team_name: teamName,
            people_count: peopleCount,
            purpose,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;

        if (purpose === '합주' && invitees.length > 0 && newRes) {
          await supabase.from('reservation_invitees').insert(
            invitees.map((uid) => ({ reservation_id: newRes.id, user_id: uid })),
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      onClose();
    } catch (err) {
      console.error(err);
      setError('저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const isEditing = !!editing;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container glass-card">
        <div className="modal-header">
          <h2>{isEditing ? '예약 수정' : '새로운 예약'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 날짜 */}
          <div className="form-group">
            <label>이용 날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* 시간 슬롯 */}
          <TimeSlotPicker
            date={date}
            reservations={reservations}
            editingId={editing?.id ?? null}
            startTime={startTime}
            endTime={endTime}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
          />

          {/* 팀명 / 인원 */}
          <div className="form-row">
            <div className="form-group">
              <label>팀명</label>
              <input
                type="text"
                placeholder="예: 밴드팀"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>사용 인원수</label>
              <input
                type="number"
                min={1}
                max={50}
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* 목적 */}
          <div className="form-group">
            <label>사용 목적</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p === '합주' ? '🎸 합주' : p === '강습' ? '📚 강습' : p}
                </option>
              ))}
            </select>
          </div>

          {/* 합주 초대 */}
          {purpose === '합주' && (
            <InviteePicker
              members={members}
              selected={invitees}
              currentUserId={currentUserId}
              onChange={setInvitees}
            />
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting
                ? isEditing ? '수정 중...' : '예약 중...'
                : isEditing ? '수정 완료' : '예약 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import TimeSlotPicker from './TimeSlotPicker';
import InviteePicker from './InviteePicker';
import type { ReservationWithDetails, Purpose, Profile } from '../../types';

const PURPOSES: Purpose[] = ['합주', '강습', '정기회의'];

interface Props {
  // 날짜 & 시간
  date: string;
  onDateChange: (v: string) => void;
  startTime: string;
  endTime: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  reservations: ReservationWithDetails[];
  editingId: string | null;
  // 팀명 & 인원
  teamName: string;
  onTeamNameChange: (v: string) => void;
  peopleCount: number;
  onPeopleCountChange: (v: number) => void;
  // 목적 & 초대
  purpose: Purpose;
  onPurposeChange: (v: Purpose) => void;
  invitees: string[];
  onInviteesChange: (v: string[]) => void;
  members: Profile[];
  currentUserId: string;
}

export default function ReservationFormFields({
  date, onDateChange,
  startTime, endTime, onStartChange, onEndChange,
  reservations, editingId,
  teamName, onTeamNameChange,
  peopleCount, onPeopleCountChange,
  purpose, onPurposeChange,
  invitees, onInviteesChange,
  members, currentUserId,
}: Props) {
  return (
    <>
      {/* 날짜 */}
      <div className="form-group">
        <label>예약 날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </div>

      {/* 시간 슬롯 */}
      <TimeSlotPicker
        date={date}
        reservations={reservations}
        editingId={editingId}
        startTime={startTime}
        endTime={endTime}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
      />

      {/* 팀명 / 인원 */}
      <div className="form-row">
        <div className="form-group">
          <label>밴드팀 이름</label>
          <input
            type="text"
            placeholder="밴드팀 이름"
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>참여 인원</label>
          <input
            type="number"
            min={1}
            max={50}
            value={peopleCount}
            onChange={(e) => onPeopleCountChange(Number(e.target.value))}
            required
          />
        </div>
      </div>

      {/* 목적 */}
      <div className="form-group">
        <label>이용 목적</label>
        <select value={purpose} onChange={(e) => onPurposeChange(e.target.value as Purpose)}>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p === '합주' ? '🎸 ' : p === '강습' ? '📚 ' : '💬 '}{p}
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
          onChange={onInviteesChange}
        />
      )}
    </>
  );
}

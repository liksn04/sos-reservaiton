import { useMemo } from 'react';
import TimeSlotPicker from './TimeSlotPicker';
import InviteePicker from './InviteePicker';
import { validateSameDayPolicy } from '../../utils/validation';
import { findActiveReservationPolicySeason, getReservationMinimumDate } from '../../utils/reservationPolicy';
import { getAvailableReservationPurposes } from '../../lib/constants';
import type { ReservationPolicySeason, ReservationWithDetails, Purpose, Profile } from '../../types';

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
  policySeasons: ReservationPolicySeason[];
  isAdmin: boolean;
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
  policySeasons,
  isAdmin,
}: Props) {
  const activeSameDaySeason = useMemo(
    () => findActiveReservationPolicySeason(policySeasons),
    [policySeasons],
  );
  const availablePurposes = useMemo(
    () => getAvailableReservationPurposes(isAdmin, purpose),
    [isAdmin, purpose],
  );

  // [규칙 1] 합주 당일 예약 경고 메시지 — 실시간 UX 피드백
  const sameDayWarning = useMemo(
    () => validateSameDayPolicy(date, purpose, policySeasons),
    [date, policySeasons, purpose],
  );

  // 날짜 input의 최솟값: 합주인 경우 내일, 그 외는 오늘
  const minDate = useMemo(() => {
    return getReservationMinimumDate(purpose, policySeasons);
  }, [policySeasons, purpose]);

  return (
    <>
      {/* 날짜 */}
      <div className="form-group">
        <label>예약 날짜</label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
        {purpose === '합주' && activeSameDaySeason && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold tracking-tight text-primary">
            <span className="material-symbols-outlined text-sm shrink-0">event_available</span>
            현재 [{activeSameDaySeason.name}] 시즌으로 오늘 합주 예약도 가능합니다.
          </p>
        )}
        {/* [규칙 1] 합주 당일 선택 시 경고 */}
        {sameDayWarning && (
          <p className="text-error mt-1.5 flex items-center gap-1 text-[11px] font-bold tracking-tight animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="material-symbols-outlined text-sm shrink-0">
              warning
            </span>
            {sameDayWarning.message}
          </p>
        )}
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
        purpose={purpose}
        teamName={teamName}
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
          {/* 2. 인원수 입력 방식 개선 (직접 입력 + 버튼 카운터 병행) */}
          <div className="flex items-stretch bg-input-bg border border-input-border rounded-[1.5rem] min-h-[56px] px-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <button
              type="button"
              className="w-11 min-h-[52px] flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-20"
              onClick={() => onPeopleCountChange(Math.max(1, peopleCount - 1))}
              disabled={peopleCount <= 1}
            >
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            
            <div className="flex-1 flex items-center justify-center gap-2 focus-within:bg-white/5 transition-colors rounded-[1rem] min-h-[52px]">
              <input
                type="number"
                min={1}
                max={9}
                value={peopleCount || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  onPeopleCountChange(Math.min(9, val));
                }}
                onBlur={() => {
                  if (peopleCount < 1) onPeopleCountChange(1);
                }}
                className="w-12 h-[52px] bg-transparent border-none outline-none text-center font-bold text-lg leading-none text-on-surface [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-0"
              />
              <span className="text-sm font-semibold text-on-surface-variant select-none">명</span>
            </div>

            <button
              type="button"
              className="w-11 min-h-[52px] flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-20"
              onClick={() => onPeopleCountChange(Math.min(9, peopleCount + 1))}
              disabled={peopleCount >= 9}
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* 목적 */}
      <div className="form-group">
        <label>이용 목적</label>
        <select value={purpose} onChange={(e) => onPurposeChange(e.target.value as Purpose)}>
          {availablePurposes.map((p) => (
            <option key={p} value={p}>
              {p === '합주' ? '🎸 ' : p === '강습' ? '📚 ' : p === '정기회의' ? '💬 ' : '🎤 '}{p}
              {p === '합주'
                ? activeSameDaySeason
                  ? ' (현재 시즌: 오늘 예약 허용 · 최대 1시간)'
                  : ' (당일 예약 불가 · 최대 1시간)'
                : p === '오디션'
                  ? ' (관리자 전용)'
                  : ''}
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

import { useEffect } from 'react';
import { getTimeSlots, computeSlotAvailability, normalizeTime } from '../../utils/time';
import type { Reservation, Purpose } from '../../types';

interface Props {
  date: string;
  reservations: Reservation[];
  editingId: string | null;
  startTime: string;
  endTime: string;
  onStartChange: (t: string) => void;
  onEndChange: (t: string) => void;
  /** [규칙 2] 합주일 때 종료 시간을 시작+1시간으로 제한 */
  purpose: Purpose;
  teamName: string;
}

const ALL_SLOTS = getTimeSlots();

/**
 * HH:MM 문자열을 분(minute) 숫자로 변환.
 * "24:00" → 1440
 */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 합주 규칙: 시작~종료 간격이 60분 이하인 종료 슬롯만 활성화.
 * 기존 disabledEnds와 합집합(union) 처리.
 */
function applyHanjuMaxDuration(
  startTime: string,
  disabledEnds: Set<string>,
): Set<string> {
  const startMin = toMinutes(normalizeTime(startTime));
  const result = new Set(disabledEnds);

  for (const slot of ALL_SLOTS) {
    if (result.has(slot)) continue; // 이미 비활성화된 슬롯은 건너뜀

    const slotMin = toMinutes(slot);
    // 익일 종료는 무조건 1시간 초과 → 비활성화
    const isNextDay = slotMin <= startMin && slot !== startTime;
    if (isNextDay) {
      result.add(slot);
      continue;
    }

    const duration = slotMin - startMin;
    // Edge case: 시작 시간과 동일한 슬롯은 computeSlotAvailability에서 이미 처리됨
    if (duration > 60) {
      result.add(slot);
    }
  }

  return result;
}

export default function TimeSlotPicker({
  date,
  reservations,
  editingId,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  purpose,
  teamName,
}: Props) {
  // 날짜, 시작 시간, 카테고리가 바뀔 때마다 가용 슬롯 재계산
  useEffect(() => {
    if (!date) return;
    const { disabledEnds, effectiveStart } = computeSlotAvailability(
      date,
      reservations,
      editingId,
      startTime,
      purpose,
      teamName,
    );

    // 합주 규칙 적용
    const finalDisabledEnds =
      purpose === '합주'
        ? applyHanjuMaxDuration(effectiveStart, disabledEnds)
        : disabledEnds;

    // 현재 시작 시간이 비활성화됐으면 첫 유효 슬롯으로 보정
    if (effectiveStart !== startTime) {
      onStartChange(effectiveStart);
    }

    // 현재 종료 시간이 비활성화됐으면 첫 유효 종료 슬롯으로 보정
    if (finalDisabledEnds.has(normalizeTime(endTime))) {
      const firstValid = ALL_SLOTS.find((t) => !finalDisabledEnds.has(t));
      if (firstValid) onEndChange(firstValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, purpose, teamName, reservations.length, editingId]);

  const { disabledStarts, disabledEnds } = computeSlotAvailability(
    date,
    reservations,
    editingId,
    startTime,
    purpose,
    teamName,
  );

  // 합주일 때 종료 슬롯 추가 제한
  const finalDisabledEnds =
    purpose === '합주'
      ? applyHanjuMaxDuration(startTime, disabledEnds)
      : disabledEnds;

  return (
    <div className="form-row">
      <div className="form-group">
        <label>시작 시간</label>
        <select
          value={startTime}
          onChange={(e) => onStartChange(e.target.value)}
          required
        >
          {ALL_SLOTS.map((t) => (
            <option key={t} value={t} disabled={disabledStarts.has(t)}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>
          종료 시간
          {purpose === '합주' && (
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginLeft: '6px', fontWeight: 600 }}>
              최대 1시간
            </span>
          )}
        </label>
        <select
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          required
        >
          {ALL_SLOTS.map((t) => (
            <option key={t} value={t} disabled={finalDisabledEnds.has(t)}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

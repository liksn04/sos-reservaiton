import { useEffect } from 'react';
import { getTimeSlots, computeSlotAvailability, normalizeTime } from '../../utils/time';
import type { Reservation } from '../../types';

interface Props {
  date: string;
  reservations: Reservation[];
  editingId: string | null;
  startTime: string;
  endTime: string;
  onStartChange: (t: string) => void;
  onEndChange: (t: string) => void;
}

const ALL_SLOTS = getTimeSlots();

export default function TimeSlotPicker({
  date,
  reservations,
  editingId,
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: Props) {
  // 날짜 또는 시작 시간이 바뀔 때마다 가용 슬롯을 재계산
  useEffect(() => {
    if (!date) return;
    const { disabledEnds, effectiveStart } = computeSlotAvailability(
      date,
      reservations,
      editingId,
      startTime,
    );

    // 현재 시작 시간이 비활성화됐으면 첫 유효 슬롯으로 보정
    if (effectiveStart !== startTime) {
      onStartChange(effectiveStart);
    }

    // 현재 종료 시간이 비활성화됐으면 첫 유효 종료 슬롯으로 보정
    if (disabledEnds.has(normalizeTime(endTime))) {
      const firstValid = ALL_SLOTS.find((t) => !disabledEnds.has(t));
      if (firstValid) onEndChange(firstValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, startTime, reservations.length, editingId]);

  const { disabledStarts, disabledEnds } = computeSlotAvailability(
    date,
    reservations,
    editingId,
    startTime,
  );

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
        <label>종료 시간</label>
        <select
          value={endTime}
          onChange={(e) => onEndChange(e.target.value)}
          required
        >
          {ALL_SLOTS.map((t) => (
            <option key={t} value={t} disabled={disabledEnds.has(t)}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

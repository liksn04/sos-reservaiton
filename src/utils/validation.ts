import { normalizeTime, hasOverlap } from './time';
import type { Reservation } from '../types';

export interface OverlapError {
  type: 'same_time' | 'overlap';
  message: string;
}

/**
 * 예약 제출 전 시간 유효성 검사.
 * 기존 app.js handleReservationSubmit의 validation 로직 포팅.
 *
 * @returns null = 유효, OverlapError = 오류
 */
export function validateReservationTime(
  date: string,
  startTime: string,
  endTime: string,
  reservations: Reservation[],
  editingId: string | null,
): OverlapError | null {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  if (start === end) {
    return { type: 'same_time', message: '시작 시간과 종료 시간이 같을 수 없습니다.' };
  }

  const isNextDay = end < start && end !== '00:00';

  const activeRes = reservations.filter((r) => r.id !== editingId);

  const overlap = activeRes.some((res) =>
    hasOverlap(
      date,
      start,
      end,
      isNextDay,
      res.date,
      normalizeTime(res.start_time),
      normalizeTime(res.end_time),
      res.is_next_day,
    ),
  );

  if (overlap) {
    return {
      type: 'overlap',
      message: '해당 시간에 이미 예약된 일정이 있습니다. 다른 시간을 선택해주세요.',
    };
  }

  return null;
}

/** 종료 시간이 시작 시간보다 문자열 순서상 앞이면 익일 */
export function computeIsNextDay(startTime: string, endTime: string): boolean {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  // "24:00"은 익일로 간주하지 않음 (당일 자정)
  if (end === '24:00') return false;
  return end < start;
}

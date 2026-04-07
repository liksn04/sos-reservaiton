import { normalizeTime, hasOverlap } from './time';
import type { Reservation, Purpose } from '../types';

export interface OverlapError {
  type: 'same_time' | 'overlap' | 'same_day_hanju' | 'max_duration_hanju';
  message: string;
}

/**
 * HH:MM 문자열을 분(minute) 단위 숫자로 변환.
 * "24:00" → 1440으로 처리.
 */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * [규칙 1] 합주 카테고리 당일 예약 불가 검증.
 * 다른 카테고리는 당일 예약 허용.
 *
 * @param date YYYY-MM-DD 형식의 예약 날짜
 * @param purpose 예약 카테고리
 * @returns null = 유효, OverlapError = 오류
 */
export function validateSameDayPolicy(
  date: string,
  purpose: Purpose,
): OverlapError | null {
  // Edge case: 합주 카테고리에서만 검사
  if (purpose !== '합주') return null;

  // Edge case: date가 비어있거나 잘못된 형식
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  if (date === todayStr) {
    return {
      type: 'same_day_hanju',
      message: '합주는 당일 예약이 불가합니다. 최소 하루 전에 예약해주세요.',
    };
  }

  return null;
}

/**
 * [규칙 2] 합주 카테고리 최대 1시간 예약 제한.
 * 다른 카테고리는 시간 제한 없음.
 *
 * @param startTime HH:MM 형식 시작 시간
 * @param endTime HH:MM 형식 종료 시간
 * @param purpose 예약 카테고리
 * @returns null = 유효, OverlapError = 오류
 */
export function validateMaxDurationPolicy(
  startTime: string,
  endTime: string,
  purpose: Purpose,
): OverlapError | null {
  // Edge case: 합주 카테고리에서만 검사
  if (purpose !== '합주') return null;

  // Edge case: 시간 값이 없는 경우
  if (!startTime || !endTime) return null;

  const startMin = toMinutes(normalizeTime(startTime));
  const endMin = toMinutes(normalizeTime(endTime));

  // 익일 종료(endMin < startMin)는 반드시 1시간 초과이므로 바로 에러
  const durationMinutes = endMin > startMin ? endMin - startMin : (1440 - startMin) + endMin;

  if (durationMinutes > 60) {
    return {
      type: 'max_duration_hanju',
      message: '합주는 최대 1시간까지만 예약 가능합니다.',
    };
  }

  return null;
}

/**
 * 예약 제출 전 전체 유효성 검사.
 * 순서: 당일 정책 → 최대 시간 정책 → 시간 동일 → 겹침 검사
 *
 * @returns null = 유효, OverlapError = 오류
 */
export function validateReservationTime(
  date: string,
  startTime: string,
  endTime: string,
  reservations: Reservation[],
  editingId: string | null,
  purpose: Purpose = '합주',
): OverlapError | null {
  // [규칙 1] 합주 당일 예약 불가
  const sameDayErr = validateSameDayPolicy(date, purpose);
  if (sameDayErr) return sameDayErr;

  // [규칙 2] 합주 최대 1시간
  const durationErr = validateMaxDurationPolicy(startTime, endTime, purpose);
  if (durationErr) return durationErr;

  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  // Edge case: 시작 == 종료
  if (start === end) {
    return { type: 'same_time', message: '시작 시간과 종료 시간이 같을 수 없습니다.' };
  }

  const isNextDay = end < start && end !== '00:00';

  const activeRes = reservations.filter((r) => r.id !== editingId);

  // Edge case: 기존 예약과 시간 겹침
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

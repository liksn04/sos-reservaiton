import { canReservationsShareTime, normalizeTime, hasOverlap, getReservationTimestamp } from './time';
import { isSameDayHanjuBookingAllowed } from './reservationPolicy';
import type { Reservation, Purpose, ReservationPolicySeason } from '../types';

export interface OverlapError {
  type: 'same_time' | 'overlap' | 'same_day_hanju' | 'max_duration_hanju' | 'past_start_time' | 'past_date' | 'admin_only_purpose' | 'outside_operating_hours';
  message: string;
}

const OPERATING_START_MINUTES = 10 * 60;
const OPERATING_END_MINUTES = 24 * 60;

/**
 * HH:MM 문자열을 분(minute) 단위 숫자로 변환.
 * "24:00" → 1440으로 처리.
 */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 관리자 전용 예약 목적 접근을 검증합니다.
 *
 * 처리하는 예외:
 * 1. 비관리자가 DOM 조작으로 숨겨진 목적값을 강제로 제출한 경우를 차단합니다.
 * 2. 모달을 열어 둔 사이 권한이 바뀌어 관리자 권한이 사라진 경우를 차단합니다.
 * 3. UI를 거치지 않고 mutation 함수를 직접 호출한 경우에도 동일 정책을 적용합니다.
 */
export function validatePurposeAccessPolicy(
  purpose: Purpose,
  isAdmin: boolean,
): OverlapError | null {
  if (purpose !== '오디션' || isAdmin) return null;

  return {
    type: 'admin_only_purpose',
    message: '오디션 예약은 관리자만 추가하거나 수정할 수 있습니다.',
  };
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
  policySeasons: ReservationPolicySeason[] = [],
  now: Date = new Date(),
): OverlapError | null {
  // Edge case: 합주 카테고리에서만 검사
  if (purpose !== '합주') return null;

  // Edge case: date가 비어있거나 잘못된 형식
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  if (date === todayStr && !isSameDayHanjuBookingAllowed(date, purpose, policySeasons, now)) {
    return {
      type: 'same_day_hanju',
      message: '합주는 당일 예약이 불가합니다. 최소 하루 전에 예약해주세요.',
    };
  }

  return null;
}

/**
 * 과거 날짜 예약을 차단합니다.
 *
 * 처리하는 예외:
 * 1. 날짜 값이 비어 있거나 형식이 잘못된 경우에는 상위 required 검증에 위임합니다.
 * 2. 브라우저 min 속성을 우회해 과거 날짜를 수동 입력한 경우를 차단합니다.
 * 3. 오래 열린 모달/직접 mutation 호출 등 UI 바깥 경로에서도 동일 정책을 적용합니다.
 *
 * @param date YYYY-MM-DD 형식의 예약 날짜
 * @param now 비교 기준 시각. 테스트 가능성을 위해 주입 가능하게 둡니다.
 */
export function validatePastDatePolicy(
  date: string,
  now: Date = new Date(),
): OverlapError | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  if (date < todayStr) {
    return {
      type: 'past_date',
      message: '지난 날짜는 예약할 수 없습니다. 오늘 이후 날짜를 선택해주세요.',
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

export function validateOperatingHoursPolicy(
  startTime: string,
  endTime: string,
): OverlapError | null {
  if (!startTime || !endTime) return null;

  const startMin = toMinutes(normalizeTime(startTime));
  const endMin = toMinutes(normalizeTime(endTime));

  if (
    startMin < OPERATING_START_MINUTES ||
    startMin >= OPERATING_END_MINUTES ||
    endMin <= OPERATING_START_MINUTES ||
    endMin > OPERATING_END_MINUTES ||
    endMin <= startMin
  ) {
    return {
      type: 'outside_operating_hours',
      message: '운영 시간은 10:00부터 24:00까지입니다. 운영 시간 안에서 시작/종료 시간을 선택해주세요.',
    };
  }

  return null;
}

/**
 * 현재 시각 이전 또는 이미 시작된 시간으로의 예약을 차단합니다.
 *
 * 처리하는 예외:
 * 1. 날짜/시간 값이 비어 있거나 형식이 잘못된 경우에는 상위 required 검증에 위임합니다.
 * 2. 사용자가 DOM 조작으로 오늘 지난 시간을 강제로 선택한 경우를 차단합니다.
 * 3. 모달을 오래 열어 둔 뒤 시간이 지나 슬롯이 과거가 된 경우 제출 시점에 다시 차단합니다.
 *
 * @param date YYYY-MM-DD 형식의 예약 날짜
 * @param startTime HH:MM 형식 시작 시간
 * @param now 비교 기준 시각. 테스트 가능성을 위해 주입 가능하게 둡니다.
 */
export function validatePastStartTimePolicy(
  date: string,
  startTime: string,
  now: Date = new Date(),
): OverlapError | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!startTime || !/^\d{2}:\d{2}$/.test(normalizeTime(startTime))) return null;

  const startTs = getReservationTimestamp(date, normalizeTime(startTime), false);
  if (!startTs) return null;

  if (startTs <= now.getTime()) {
    return {
      type: 'past_start_time',
      message: '현재 시간 이전은 예약할 수 없습니다. 이후 시간대를 선택해주세요.',
    };
  }

  return null;
}

/**
 * 예약 제출 전 전체 유효성 검사.
 * 순서: 과거 날짜 → 당일 정책 → 최대 시간 정책 → 과거 시간 → 시간 동일 → 겹침 검사
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
  policySeasons: ReservationPolicySeason[] = [],
  now: Date = new Date(),
  teamName = '',
): OverlapError | null {
  const pastDateErr = validatePastDatePolicy(date, now);
  if (pastDateErr) return pastDateErr;

  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  // Edge case: 시작 == 종료
  if (start === end) {
    return { type: 'same_time', message: '시작 시간과 종료 시간이 같을 수 없습니다.' };
  }

  // [규칙 1] 합주 당일 예약 불가
  const sameDayErr = validateSameDayPolicy(date, purpose, policySeasons, now);
  if (sameDayErr) return sameDayErr;

  // [규칙 2] 합주 최대 1시간
  const durationErr = validateMaxDurationPolicy(startTime, endTime, purpose);
  if (durationErr) return durationErr;

  const operatingHoursErr = validateOperatingHoursPolicy(startTime, endTime);
  if (operatingHoursErr) return operatingHoursErr;

  const pastStartErr = validatePastStartTimePolicy(date, startTime, now);
  if (pastStartErr) return pastStartErr;

  const isNextDay = end < start && end !== '00:00';

  const activeRes = reservations.filter((r) => r.id !== editingId);
  const currentReservation = {
    purpose,
    team_name: teamName,
  } satisfies Pick<Reservation, 'purpose' | 'team_name'>;

  // Edge case: 기존 예약과 시간 겹침
  const overlap = activeRes.some((res) =>
    !canReservationsShareTime(currentReservation, res)
    && hasOverlap(
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

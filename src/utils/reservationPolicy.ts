import { formatDate } from './time';
import type { Purpose, ReservationPolicySeason, ReservationPolicySeasonInput } from '../types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function trimToNull(value?: string | null): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidDateString(value: string): boolean {
  return DATE_PATTERN.test(value);
}

export function getTomorrowDate(now: Date = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export function isReservationPolicySeasonActiveOnDate(
  season: Pick<ReservationPolicySeason, 'is_active' | 'start_date' | 'end_date'>,
  targetDate: string,
): boolean {
  if (!season.is_active) return false;
  if (!isValidDateString(targetDate)) return false;
  if (!isValidDateString(season.start_date) || !isValidDateString(season.end_date)) return false;

  return season.start_date <= targetDate && targetDate <= season.end_date;
}

export function findActiveReservationPolicySeason(
  seasons: ReservationPolicySeason[],
  targetDate: string = formatDate(new Date()),
): ReservationPolicySeason | null {
  const activeSeason = seasons.find((season) =>
    isReservationPolicySeasonActiveOnDate(season, targetDate),
  );

  return activeSeason ?? null;
}

export function isSameDayHanjuBookingAllowed(
  date: string,
  purpose: Purpose,
  seasons: ReservationPolicySeason[],
  now: Date = new Date(),
): boolean {
  if (purpose !== '합주') return false;
  if (!isValidDateString(date)) return false;

  const today = formatDate(now);
  if (date !== today) return false;

  return findActiveReservationPolicySeason(seasons, today) !== null;
}

export function getReservationMinimumDate(
  purpose: Purpose,
  seasons: ReservationPolicySeason[],
  now: Date = new Date(),
): string {
  const today = formatDate(now);

  if (purpose !== '합주') {
    return today;
  }

  return findActiveReservationPolicySeason(seasons, today) ? today : getTomorrowDate(now);
}

export function sanitizeReservationPolicySeasonInput(
  input: ReservationPolicySeasonInput,
): ReservationPolicySeasonInput {
  return {
    name: input.name.trim(),
    start_date: input.start_date,
    end_date: input.end_date,
    note: trimToNull(input.note),
    is_active: input.is_active,
  };
}

export function validateReservationPolicySeasonInput(
  input: ReservationPolicySeasonInput,
  existingSeasons: ReservationPolicySeason[],
  editingId: string | null = null,
): string | null {
  const normalized = sanitizeReservationPolicySeasonInput(input);

  // Edge case: 공백만 입력된 이름은 DB 체크 제약 이전에 즉시 차단합니다.
  if (!normalized.name) {
    return '시즌 이름을 입력해주세요.';
  }

  // Edge case: 너무 긴 텍스트는 모바일 UI와 DB 컬럼 검증을 함께 보호합니다.
  if (normalized.name.length > 60) {
    return '시즌 이름은 60자 이하여야 합니다.';
  }

  // Edge case: 날짜 input 우회 또는 비정상 payload를 방어합니다.
  if (!isValidDateString(normalized.start_date) || !isValidDateString(normalized.end_date)) {
    return '시즌 날짜 형식이 올바르지 않습니다.';
  }

  if (normalized.start_date > normalized.end_date) {
    return '시즌 시작일은 종료일보다 늦을 수 없습니다.';
  }

  if ((normalized.note ?? '').length > 200) {
    return '시즌 설명은 200자 이하여야 합니다.';
  }

  if (!normalized.is_active) {
    return null;
  }

  const hasOverlap = existingSeasons.some((season) => {
    if (season.id === editingId || !season.is_active) return false;

    return season.start_date <= normalized.end_date && normalized.start_date <= season.end_date;
  });

  if (hasOverlap) {
    return '활성화된 당일 예약 허용 시즌은 서로 겹칠 수 없습니다.';
  }

  return null;
}

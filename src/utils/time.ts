import type { Purpose, Reservation } from '../types';

/** YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Supabase time 컬럼은 "HH:MM:SS"로 반환될 수 있다.
 * 앱 전체에서 "HH:MM" 형식으로 통일한다.
 */
export function normalizeTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/**
 * 날짜 문자열 + 시간 문자열 → 밀리초 타임스탬프.
 * "24:00" 처리: new Date(y, m-1, d, 24, 0) → JavaScript가 자동으로 익일 00:00으로 변환.
 * isNextDay=true 이면 날짜를 +1.
 */
export function getReservationTimestamp(
  dateStr: string,
  timeStr: string,
  isNextDay = false,
): number {
  if (!dateStr || !timeStr) return 0;
  const [year, month, day] = dateStr.split('-').map(Number);
  const normalized = normalizeTime(timeStr);
  const [hours, minutes] = normalized.split(':').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes);
  if (isNextDay) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** 30분 단위 시간 슬롯 배열: ["00:00", "00:30", ..., "23:30", "24:00"] */
export function getTimeSlots(): string[] {
  const times: string[] = [];
  for (let h = 0; h <= 23; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    times.push(`${String(h).padStart(2, '0')}:30`);
  }
  times.push('24:00');
  return times;
}

export interface SlotAvailability {
  disabledStarts: Set<string>;
  disabledEnds: Set<string>;
  /** 현재 startTime이 비활성화됐을 경우 첫 번째 유효한 시작 시간 */
  effectiveStart: string;
}

export function normalizeReservationTeamName(teamName: string): string {
  return teamName.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * 오디션 예약은 서로 다른 팀명일 때만 시간대를 공유할 수 있습니다.
 *
 * 처리하는 예외:
 * 1. 둘 중 하나라도 오디션이 아니면 기존 단일 점유 규칙을 유지합니다.
 * 2. 팀명이 비어 있으면 안전하게 중복 불가로 처리합니다.
 * 3. 대소문자/연속 공백 차이만 있는 동일 팀명은 같은 팀으로 간주합니다.
 */
export function canReservationsShareTime(
  a: Pick<Reservation, 'purpose' | 'team_name'>,
  b: Pick<Reservation, 'purpose' | 'team_name'>,
): boolean {
  if (a.purpose !== '오디션' || b.purpose !== '오디션') return false;

  const teamA = normalizeReservationTeamName(a.team_name);
  const teamB = normalizeReservationTeamName(b.team_name);

  if (!teamA || !teamB) return false;

  return teamA !== teamB;
}

/**
 * 기존 app.js의 updateAvailableTimeOptions() 로직을 TypeScript로 포팅.
 *
 * - 선택한 날짜의 기존 예약과 충돌하는 시작 시간을 비활성화.
 * - 선택한 시작 시간 이후 다음 예약 시작 전까지만 종료 시간 활성화.
 * - editingId: 수정 중인 예약은 자신과 충돌하지 않도록 제외.
 */
export function computeSlotAvailability(
  date: string,
  reservations: Reservation[],
  editingId: string | null,
  selectedStart: string,
  purpose: Purpose = '합주',
  teamName = '',
  now: Date = new Date(),
): SlotAvailability {
  const currentReservation = {
    purpose,
    team_name: teamName,
  } satisfies Pick<Reservation, 'purpose' | 'team_name'>;

  const activeRes = reservations.filter((r) => {
    if (r.id === editingId || r.date !== date) return false;
    return !canReservationsShareTime(currentReservation, r);
  });

  const scheduled = activeRes.map((r) => ({
    startTs: getReservationTimestamp(r.date, normalizeTime(r.start_time), false),
    endTs: getReservationTimestamp(r.date, normalizeTime(r.end_time), r.is_next_day),
  }));

  const allSlots = getTimeSlots();
  const disabledStarts = new Set<string>();
  const todayStr = formatDate(now);
  const nowTs = now.getTime();

  // 24:00은 시작 시간으로 항상 비활성화
  disabledStarts.add('24:00');

  for (const time of allSlots) {
    if (time === '24:00') continue;
    const optTs = getReservationTimestamp(date, time, false);

    // Edge case: 오늘 날짜에서 이미 시작된 슬롯은 원천 차단
    if (date === todayStr && optTs <= nowTs) {
      disabledStarts.add(time);
      continue;
    }

    const overlap = scheduled.some((r) => optTs >= r.startTs && optTs < r.endTs);
    if (overlap) disabledStarts.add(time);
  }

  // 현재 선택된 시작 시간이 비활성화됐으면 첫 번째 유효한 슬롯으로 보정
  let effectiveStart = selectedStart;
  if (disabledStarts.has(effectiveStart)) {
    effectiveStart = allSlots.find((t) => !disabledStarts.has(t)) ?? selectedStart;
  }

  const newStartTs = getReservationTimestamp(date, effectiveStart, false);

  // 선택한 시작 이후에 오는 예약들 중 가장 빠른 것의 시작 시간 = 최대 종료 시간
  const futureRes = scheduled
    .filter((r) => r.startTs >= newStartTs)
    .sort((a, b) => a.startTs - b.startTs);
  const maxEndTs =
    futureRes.length > 0
      ? futureRes[0].startTs
      : newStartTs + 24 * 60 * 60 * 1000;

  const disabledEnds = new Set<string>();

  for (const time of allSlots) {
    // 종료 시간이 시작 시간보다 문자열 순서상 앞이면 익일
    let isNextDay = time <= effectiveStart;
    // "24:00"은 effectiveStart가 "24:00"이 아닌 한 익일이 아님 (당일 자정)
    if (time === '24:00' && effectiveStart !== '24:00') isNextDay = false;

    if (time === effectiveStart) {
      disabledEnds.add(time);
      continue;
    }

    const optEndTs = getReservationTimestamp(date, time, isNextDay);
    if (optEndTs <= newStartTs || optEndTs > maxEndTs) {
      disabledEnds.add(time);
    }
  }

  return { disabledStarts, disabledEnds, effectiveStart };
}

/** 두 예약이 시간적으로 겹치는지 확인 */
export function hasOverlap(
  dateA: string,
  startA: string,
  endA: string,
  isNextDayA: boolean,
  dateB: string,
  startB: string,
  endB: string,
  isNextDayB: boolean,
): boolean {
  const sA = getReservationTimestamp(dateA, startA, false);
  const eA = getReservationTimestamp(dateA, endA, isNextDayA);
  const sB = getReservationTimestamp(dateB, startB, false);
  const eB = getReservationTimestamp(dateB, endB, isNextDayB);
  return sA < eB && eA > sB;
}

/**
 * 예약의 종료 시간을 기준으로 이미 한 시점인지 확인합니다.
 * @param date YYYY-MM-DD
 * @param endTime HH:mm
 * @param isNextDay 익일 종료 여부
 */
export function isPastReservation(
  date: string,
  endTime: string,
  isNextDay: boolean,
): boolean {
  const endTs = getReservationTimestamp(date, endTime, isNextDay);
  return Date.now() > endTs;
}

/**
 * 예약 날짜가 현재로부터 지정된 기간(기본 14일) 이상 경과했는지 확인합니다.
 * @param date YYYY-MM-DD
 * @param days 경과 일수 (기본 14일)
 */
export function isOldReservation(date: string, days = 14): boolean {
  if (!date) return false;
  // 해당 날짜의 시작 시점(00:00)을 기준으로 계산합니다.
  const targetTs = getReservationTimestamp(date, '00:00', false);
  const nowTs = Date.now();
  const diff = nowTs - targetTs;
  return diff > days * 24 * 60 * 60 * 1000;
}

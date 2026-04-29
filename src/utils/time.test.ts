import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canReservationsShareTime,
  computeSlotAvailability,
  formatDate,
  getReservationTimestamp,
  getTimeSlots,
  getNextReservation,
  getOngoingReservation,
  hasOverlap,
  isReservationOngoingAt,
  isOldReservation,
  isPastReservation,
  normalizeTime,
} from './time';
import type { Reservation } from '../types';

const now = new Date(2026, 3, 13, 10, 15, 0);
const today = '2026-04-13';

describe('time utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('날짜와 시간을 앱 표준 포맷으로 변환한다', () => {
    expect(formatDate(now)).toBe(today);
    expect(normalizeTime('09:30:00')).toBe('09:30');
    expect(getTimeSlots()[0]).toBe('00:00');
    expect(getTimeSlots().at(-1)).toBe('24:00');
    expect(getTimeSlots()).toHaveLength(49);
  });

  it('타임스탬프 계산에서 익일 종료와 24:00을 올바르게 처리한다', () => {
    const sameDayMidnight = getReservationTimestamp(today, '24:00', false);
    const nextDayTime = getReservationTimestamp(today, '00:30', true);

    expect(nextDayTime).toBeGreaterThan(sameDayMidnight);
    expect(nextDayTime - sameDayMidnight).toBe(30 * 60 * 1000);
  });

  it('선택 가능한 시작/종료 슬롯을 현재 시각과 기존 예약 기준으로 계산한다', () => {
    const reservations: Reservation[] = [
      {
        id: 'reservation-1',
        host_id: 'host-1',
        date: today,
        start_time: '11:00',
        end_time: '12:30',
        is_next_day: false,
        team_name: '기존 팀',
        people_count: 4,
        purpose: '강습',
        created_at: '2026-04-01T00:00:00.000Z',
      },
    ];

    const availability = computeSlotAvailability(today, reservations, null, '10:00', '강습', '', now);

    expect(availability.disabledStarts.has('10:00')).toBe(true);
    expect(availability.disabledStarts.has('11:00')).toBe(true);
    expect(availability.effectiveStart).toBe('10:30');
    expect(availability.disabledEnds.has('10:30')).toBe(true);
    expect(availability.disabledEnds.has('11:30')).toBe(true);
    expect(availability.disabledEnds.has('11:00')).toBe(false);
  });

  it('뒤에 예약이 없으면 24:00까지 종료 슬롯을 열어둔다', () => {
    const availability = computeSlotAvailability(today, [], null, '23:30', '강습', '', now);

    expect(availability.effectiveStart).toBe('23:30');
    expect(availability.disabledEnds.has('24:00')).toBe(false);
  });

  it('오디션은 기존 예약 카테고리와 무관하게 서로 다른 팀이면 같은 시간대를 공유할 수 있다', () => {
    const reservations: Reservation[] = [
      {
        id: 'reservation-1',
        host_id: 'host-1',
        date: today,
        start_time: '11:00',
        end_time: '12:30',
        is_next_day: false,
        team_name: '기존 팀',
        people_count: 4,
        purpose: '강습',
        created_at: '2026-04-01T00:00:00.000Z',
      },
    ];

    const availability = computeSlotAvailability(today, reservations, null, '11:00', '오디션', '새 팀', now);

    expect(availability.disabledStarts.has('11:00')).toBe(false);
    expect(availability.disabledEnds.has('12:30')).toBe(false);
  });

  it('오디션이어도 같은 팀이면 기존 카테고리와 무관하게 겹침을 차단한다', () => {
    expect(canReservationsShareTime(
      { purpose: '오디션', team_name: 'Alpha Team' } as Reservation,
      { purpose: '강습', team_name: ' alpha   team ' } as Reservation,
    )).toBe(false);

    expect(canReservationsShareTime(
      { purpose: '오디션', team_name: 'Alpha Team' } as Reservation,
      { purpose: '합주', team_name: 'Beta Team' } as Reservation,
    )).toBe(true);

    expect(canReservationsShareTime(
      { purpose: '강습', team_name: 'Alpha Team' } as Reservation,
      { purpose: '오디션', team_name: 'Beta Team' } as Reservation,
    )).toBe(false);
  });

  it('예약 시간 겹침을 정확히 판별한다', () => {
    expect(
      hasOverlap(today, '10:00', '11:00', false, today, '10:30', '11:30', false),
    ).toBe(true);

    expect(
      hasOverlap(today, '10:00', '11:00', false, today, '11:00', '12:00', false),
    ).toBe(false);
  });

  it('자정 이후에도 같은 시각의 전날 예약을 진행중으로 오인하지 않는다', () => {
    const previousDayReservation: Reservation = {
      id: 'previous-day',
      host_id: 'host-1',
      date: '2026-04-29',
      start_time: '01:00',
      end_time: '02:00',
      is_next_day: false,
      team_name: '우리의 밤 중간점검',
      people_count: 5,
      purpose: '오디션',
      created_at: '2026-04-20T00:00:00.000Z',
    };
    const currentDayReservation: Reservation = {
      id: 'annie',
      host_id: 'host-2',
      date: '2026-04-30',
      start_time: '01:00',
      end_time: '02:00',
      is_next_day: false,
      team_name: 'Annie. 중간점검',
      people_count: 5,
      purpose: '오디션',
      created_at: '2026-04-20T00:00:00.000Z',
    };
    const nowAfterMidnight = new Date(2026, 3, 30, 1, 54, 0);

    expect(isReservationOngoingAt(previousDayReservation, nowAfterMidnight)).toBe(false);
    expect(getOngoingReservation(
      [previousDayReservation, currentDayReservation],
      nowAfterMidnight,
    )?.id).toBe('annie');
  });

  it('익일 종료 예약은 자정을 넘긴 뒤에도 진행중으로 계산한다', () => {
    const overnightReservation: Reservation = {
      id: 'overnight',
      host_id: 'host-1',
      date: '2026-04-29',
      start_time: '23:30',
      end_time: '00:30',
      is_next_day: true,
      team_name: '심야 합주',
      people_count: 4,
      purpose: '합주',
      created_at: '2026-04-20T00:00:00.000Z',
    };

    expect(isReservationOngoingAt(overnightReservation, new Date(2026, 3, 30, 0, 15, 0))).toBe(true);
  });

  it('다음 일정은 이미 지난 전날 예약을 제외하고 시작 타임스탬프 기준으로 고른다', () => {
    const reservations: Reservation[] = [
      {
        id: 'previous-day',
        host_id: 'host-1',
        date: '2026-04-29',
        start_time: '01:00',
        end_time: '02:00',
        is_next_day: false,
        team_name: '전날 일정',
        people_count: 5,
        purpose: '오디션',
        created_at: '2026-04-20T00:00:00.000Z',
      },
      {
        id: 'later-today',
        host_id: 'host-2',
        date: '2026-04-30',
        start_time: '03:00',
        end_time: '04:00',
        is_next_day: false,
        team_name: '다음 일정',
        people_count: 5,
        purpose: '오디션',
        created_at: '2026-04-20T00:00:00.000Z',
      },
    ];

    expect(getNextReservation(reservations, new Date(2026, 3, 30, 1, 54, 0))?.id).toBe('later-today');
  });

  it('지난 예약과 오래된 예약 여부를 판별한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 12, 0, 0));

    expect(isPastReservation(today, '11:30', false)).toBe(true);
    expect(isPastReservation(today, '12:30', false)).toBe(false);
    expect(isOldReservation('2026-03-20', 14)).toBe(true);
    expect(isOldReservation(today, 14)).toBe(false);
  });
});

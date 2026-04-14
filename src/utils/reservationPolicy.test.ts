import { describe, expect, it } from 'vitest';
import {
  getReservationMinimumDate,
  isSameDayHanjuBookingAllowed,
  sanitizeReservationPolicySeasonInput,
  validateReservationPolicySeasonInput,
} from './reservationPolicy';
import {
  computeIsNextDay,
  validateMaxDurationPolicy,
  validatePastDatePolicy,
  validatePastStartTimePolicy,
  validateReservationTime,
  validateSameDayPolicy,
} from './validation';
import type { Reservation } from '../types';
import type { ReservationPolicySeason } from '../types';

const mockNow = new Date(2026, 3, 13, 10, 0, 0);
const today = '2026-04-13';
const tomorrow = '2026-04-14';

function createSeason(overrides: Partial<ReservationPolicySeason> = {}): ReservationPolicySeason {
  return {
    id: overrides.id ?? 'season-1',
    name: overrides.name ?? '축제 주간 특별 운영',
    start_date: overrides.start_date ?? today,
    end_date: overrides.end_date ?? tomorrow,
    note: overrides.note ?? '특별 운영 기간',
    is_active: overrides.is_active ?? true,
    created_by: overrides.created_by ?? 'admin-1',
    created_at: overrides.created_at ?? '2026-04-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-04-01T00:00:00.000Z',
  };
}

describe('reservationPolicy', () => {
  it('활성 시즌이 없으면 합주 최소 예약일을 내일로 계산한다', () => {
    expect(getReservationMinimumDate('합주', [], mockNow)).toBe(tomorrow);
  });

  it('활성 시즌이 있으면 오늘 합주 예약을 허용한다', () => {
    const seasons = [createSeason()];

    expect(getReservationMinimumDate('합주', seasons, mockNow)).toBe(today);
    expect(isSameDayHanjuBookingAllowed(today, '합주', seasons, mockNow)).toBe(true);
    expect(validateSameDayPolicy(today, '합주', seasons, mockNow)).toBeNull();
  });

  it('활성 시즌이 없으면 오늘 합주 예약을 차단한다', () => {
    const error = validateSameDayPolicy(today, '합주', [], mockNow);

    expect(error?.type).toBe('same_day_hanju');
  });

  it('합주가 아니거나 날짜 형식이 잘못되면 당일 시즌 허용 여부를 false로 본다', () => {
    const seasons = [createSeason()];

    expect(isSameDayHanjuBookingAllowed(today, '강습', seasons, mockNow)).toBe(false);
    expect(isSameDayHanjuBookingAllowed('2026/04/13', '합주', seasons, mockNow)).toBe(false);
  });

  it('전체 예약 검증에서 시즌 중인 당일 합주 예약을 통과시킨다', () => {
    const seasons = [createSeason()];

    const error = validateReservationTime(
      today,
      '11:00',
      '12:00',
      [],
      null,
      '합주',
      seasons,
      mockNow,
    );

    expect(error).toBeNull();
  });

  it('활성 시즌은 서로 겹치지 않도록 검증한다', () => {
    const existingSeasons = [
      createSeason({ id: 'season-1', start_date: '2026-04-10', end_date: '2026-04-15' }),
    ];

    const error = validateReservationPolicySeasonInput(
      {
        name: '시험 기간 연장 운영',
        start_date: '2026-04-14',
        end_date: '2026-04-18',
        note: '중복 확인',
        is_active: true,
      },
      existingSeasons,
    );

    expect(error).toBe('활성화된 당일 예약 허용 시즌은 서로 겹칠 수 없습니다.');
  });

  it('비활성 시즌은 겹쳐도 저장할 수 있고 긴 메모는 차단한다', () => {
    const inactiveAllowed = validateReservationPolicySeasonInput(
      {
        name: '휴면 시즌',
        start_date: '2026-04-14',
        end_date: '2026-04-18',
        note: '',
        is_active: false,
      },
      [createSeason({ start_date: '2026-04-10', end_date: '2026-04-16' })],
    );

    const longNoteError = validateReservationPolicySeasonInput(
      {
        name: '메모 길이 테스트',
        start_date: today,
        end_date: tomorrow,
        note: 'a'.repeat(201),
        is_active: true,
      },
      [],
    );

    expect(inactiveAllowed).toBeNull();
    expect(longNoteError).toBe('시즌 설명은 200자 이하여야 합니다.');
  });

  it('입력값 저장 전 공백을 정리한다', () => {
    const sanitized = sanitizeReservationPolicySeasonInput({
      name: '  축제 시즌  ',
      start_date: today,
      end_date: tomorrow,
      note: '  안내 문구  ',
      is_active: true,
    });

    expect(sanitized.name).toBe('축제 시즌');
    expect(sanitized.note).toBe('안내 문구');
  });

  it('과거 날짜와 과거 시작 시간은 예약 검증에서 차단한다', () => {
    expect(validatePastDatePolicy('2026-04-12', mockNow)?.type).toBe('past_date');
    expect(validatePastStartTimePolicy(today, '09:30', mockNow)?.type).toBe('past_start_time');
  });

  it('합주는 최대 1시간까지만 예약 가능하다', () => {
    expect(validateMaxDurationPolicy('10:00', '11:30', '합주')?.type).toBe('max_duration_hanju');
    expect(validateMaxDurationPolicy('10:00', '11:30', '강습')).toBeNull();
  });

  it('기존 예약과 겹치면 전체 예약 검증에서 차단한다', () => {
    const reservations: Reservation[] = [
      {
        id: 'reservation-1',
        host_id: 'host-1',
        date: tomorrow,
        start_time: '13:00',
        end_time: '14:00',
        is_next_day: false,
        team_name: '기존 팀',
        people_count: 4,
        purpose: '강습',
        created_at: '2026-04-01T00:00:00.000Z',
      },
    ];

    const error = validateReservationTime(
      tomorrow,
      '13:30',
      '14:30',
      reservations,
      null,
      '강습',
      [],
      mockNow,
    );

    expect(error?.type).toBe('overlap');
  });

  it('익일 종료 여부를 정확히 계산한다', () => {
    expect(computeIsNextDay('23:30', '00:30')).toBe(true);
    expect(computeIsNextDay('23:30', '24:00')).toBe(false);
  });

  it('시작 시간과 종료 시간이 같으면 전체 예약 검증에서 차단한다', () => {
    const error = validateReservationTime(
      tomorrow,
      '13:00',
      '13:00',
      [],
      null,
      '강습',
      [],
      mockNow,
    );

    expect(error?.type).toBe('same_time');
  });
});

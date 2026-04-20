import { describe, expect, it } from 'vitest';
import type { ReservationWithDetails } from '../types';
import {
  buildReservationParticipantItems,
  formatReservationDetailDate,
  formatReservationDetailTimeRange,
  getReservationDurationLabel,
} from './reservationDetails';

function createReservation(
  overrides: Partial<ReservationWithDetails> = {},
): ReservationWithDetails {
  return {
    id: overrides.id ?? 'reservation-1',
    host_id: overrides.host_id ?? 'host-1',
    date: overrides.date ?? '2026-04-20',
    start_time: overrides.start_time ?? '19:00:00',
    end_time: overrides.end_time ?? '20:30:00',
    is_next_day: overrides.is_next_day ?? false,
    team_name: overrides.team_name ?? '굿바이바이',
    people_count: overrides.people_count ?? 5,
    purpose: overrides.purpose ?? '합주',
    created_at: overrides.created_at ?? '2026-04-01T10:00:00.000Z',
    host: overrides.host ?? {
      id: 'host-1',
      display_name: '정진하',
      avatar_url: null,
    },
    reservation_invitees: overrides.reservation_invitees ?? [
      {
        user_id: 'host-1',
        profile: {
          id: 'host-1',
          display_name: '정진하',
          avatar_url: null,
        },
      },
      {
        user_id: 'member-1',
        profile: {
          id: 'member-1',
          display_name: '김빛소리',
          avatar_url: null,
        },
      },
      {
        user_id: 'member-2',
        profile: null,
      },
    ],
  };
}

describe('reservationDetails utilities', () => {
  it('상세 모달용 날짜와 시간 범위를 읽기 쉬운 형식으로 변환한다', () => {
    const reservation = createReservation();

    expect(formatReservationDetailDate(reservation.date)).toBe('2026년 4월 20일 (월)');
    expect(formatReservationDetailTimeRange(reservation)).toBe('19:00 - 20:30');
    expect(getReservationDurationLabel(reservation)).toBe('1시간 30분');
  });

  it('익일 종료 예약은 시간 범위와 총 길이를 올바르게 표시한다', () => {
    const reservation = createReservation({
      start_time: '23:30:00',
      end_time: '01:00:00',
      is_next_day: true,
    });

    expect(formatReservationDetailTimeRange(reservation)).toBe('23:30 - 익일 01:00');
    expect(getReservationDurationLabel(reservation)).toBe('1시간 30분');
  });

  it('참여 명단은 호스트를 우선 배치하고 중복 및 누락 프로필을 안전하게 처리한다', () => {
    const participants = buildReservationParticipantItems(createReservation());

    expect(participants).toEqual([
      {
        id: 'host-1',
        displayName: '정진하',
        avatarUrl: null,
        role: 'host',
      },
      {
        id: 'member-1',
        displayName: '김빛소리',
        avatarUrl: null,
        role: 'invitee',
      },
      {
        id: 'member-2',
        displayName: '이름 미확인 멤버',
        avatarUrl: null,
        role: 'invitee',
      },
    ]);
  });

  it('잘못된 날짜나 시간은 원본 또는 안전한 기본값으로 되돌린다', () => {
    expect(formatReservationDetailDate('2026/04/20')).toBe('2026/04/20');
    expect(
      getReservationDurationLabel(
        createReservation({ start_time: '20:00:00', end_time: '19:00:00', is_next_day: false }),
      ),
    ).toBe('시간 정보 없음');
  });
});

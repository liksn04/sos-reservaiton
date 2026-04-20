import type { ReservationWithDetails } from '../types';
import { getReservationTimestamp, normalizeTime } from './time';

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export interface ReservationParticipantItem {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'host' | 'invitee';
}

export function formatReservationDetailDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return date;
  }

  return `${year}년 ${month}월 ${day}일 (${KOREAN_WEEKDAYS[parsedDate.getDay()]})`;
}

export function formatReservationDetailTimeRange(
  reservation: Pick<ReservationWithDetails, 'start_time' | 'end_time' | 'is_next_day'>,
): string {
  const startTime = normalizeTime(reservation.start_time);
  const endTime = normalizeTime(reservation.end_time);

  return reservation.is_next_day
    ? `${startTime} - 익일 ${endTime}`
    : `${startTime} - ${endTime}`;
}

export function getReservationDurationLabel(
  reservation: Pick<ReservationWithDetails, 'date' | 'start_time' | 'end_time' | 'is_next_day'>,
): string {
  const startTimestamp = getReservationTimestamp(reservation.date, reservation.start_time, false);
  const endTimestamp = getReservationTimestamp(
    reservation.date,
    reservation.end_time,
    reservation.is_next_day,
  );

  if (startTimestamp <= 0 || endTimestamp <= startTimestamp) {
    return '시간 정보 없음';
  }

  const durationMinutes = Math.round((endTimestamp - startTimestamp) / (60 * 1000));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  if (hours > 0) {
    return `${hours}시간`;
  }

  return `${minutes}분`;
}

export function buildReservationParticipantItems(
  reservation: ReservationWithDetails,
): ReservationParticipantItem[] {
  const items: ReservationParticipantItem[] = [];
  const seenIds = new Set<string>();

  // Edge case 1: host profile relation이 비어도 예약 자체는 남아 있을 수 있어 host_id로 안전하게 표시합니다.
  const hostId = reservation.host?.id ?? reservation.host_id;
  const hostDisplayName = reservation.host?.display_name?.trim() || '알 수 없는 예약자';

  items.push({
    id: hostId,
    displayName: hostDisplayName,
    avatarUrl: reservation.host?.avatar_url ?? null,
    role: 'host',
  });
  seenIds.add(hostId);

  for (const invitee of reservation.reservation_invitees ?? []) {
    // Edge case 2: profile 조인이 실패한 초대 멤버도 user_id 기준으로 중복 없이 남깁니다.
    const participantId = invitee.profile?.id ?? invitee.user_id;
    if (!participantId || seenIds.has(participantId)) continue;

    seenIds.add(participantId);
    items.push({
      id: participantId,
      // Edge case 3: 이름이 비어 있거나 null이면 UI가 깨지지 않도록 안전한 기본값을 사용합니다.
      displayName: invitee.profile?.display_name?.trim() || '이름 미확인 멤버',
      avatarUrl: invitee.profile?.avatar_url ?? null,
      role: 'invitee',
    });
  }

  return items;
}

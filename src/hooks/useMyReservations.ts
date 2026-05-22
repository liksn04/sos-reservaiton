import { useMemo } from 'react';
import {
  getReservationEndTimestamp,
  getReservationStartTimestamp,
} from '../utils/time';
import type { MyReservation, ReservationWithDetails } from '../types';

interface UseMyReservationsArgs {
  reservations: ReservationWithDetails[];
  userId: string | undefined;
  nowMs: number;
}

interface MyReservationsResult {
  upcoming: MyReservation[];
  history: MyReservation[];
}

function isMineFor(reservation: ReservationWithDetails, userId: string): boolean {
  if (reservation.host_id === userId) return true;
  return reservation.reservation_invitees?.some((inv) => inv.user_id === userId) ?? false;
}

function compareStart(a: MyReservation, b: MyReservation): number {
  const startDiff = getReservationStartTimestamp(a) - getReservationStartTimestamp(b);
  if (startDiff !== 0) return startDiff;
  return getReservationEndTimestamp(a) - getReservationEndTimestamp(b);
}

export function useMyReservations({ reservations, userId, nowMs }: UseMyReservationsArgs): MyReservationsResult {
  return useMemo(() => {
    if (!userId) return { upcoming: [], history: [] };

    const mine: MyReservation[] = [];
    for (const r of reservations) {
      if (!isMineFor(r, userId)) continue;
      mine.push({ ...r, role: r.host_id === userId ? 'host' : 'invitee' });
    }
    mine.sort(compareStart);

    const upcoming: MyReservation[] = [];
    const past: MyReservation[] = [];
    for (const r of mine) {
      if (getReservationEndTimestamp(r) > nowMs) upcoming.push(r);
      else past.push(r);
    }
    past.reverse();

    return { upcoming, history: past };
  }, [reservations, userId, nowMs]);
}

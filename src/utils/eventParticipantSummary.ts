import type { EventParticipantSummary } from '../types';

interface EventParticipantCountRow {
  event_id: string;
  participant_count: number | null;
}

interface ViewerParticipationRow {
  event_id: string;
}

export function buildEventParticipantSummaryMap(params: {
  eventIds: readonly string[];
  countRows: EventParticipantCountRow[];
  viewerRows: ViewerParticipationRow[];
}) {
  const countsByEventId = new Map(
    params.countRows.map((row) => [row.event_id, Math.max(0, Number(row.participant_count ?? 0))]),
  );
  const joinedEventIds = new Set(params.viewerRows.map((row) => row.event_id));

  return params.eventIds.reduce<Record<string, EventParticipantSummary>>((accumulator, eventId) => {
    accumulator[eventId] = {
      eventId,
      participantCount: countsByEventId.get(eventId) ?? 0,
      viewerJoined: joinedEventIds.has(eventId),
    };

    return accumulator;
  }, {});
}

import type { EventParticipantSummary } from '../types';

interface EventParticipantCountRow {
  event_id: string;
}

interface ViewerParticipationRow {
  event_id: string;
}

export function buildEventParticipantSummaryMap(params: {
  eventIds: readonly string[];
  countRows: EventParticipantCountRow[];
  viewerRows: ViewerParticipationRow[];
  hasExactParticipantCount: boolean;
}) {
  const countsByEventId = params.countRows.reduce<Map<string, number>>((accumulator, row) => {
    accumulator.set(row.event_id, (accumulator.get(row.event_id) ?? 0) + 1);
    return accumulator;
  }, new Map());
  const joinedEventIds = new Set(params.viewerRows.map((row) => row.event_id));

  return params.eventIds.reduce<Record<string, EventParticipantSummary>>((accumulator, eventId) => {
    accumulator[eventId] = {
      eventId,
      participantCount: countsByEventId.get(eventId) ?? 0,
      viewerJoined: joinedEventIds.has(eventId),
      hasExactParticipantCount: params.hasExactParticipantCount,
    };

    return accumulator;
  }, {});
}

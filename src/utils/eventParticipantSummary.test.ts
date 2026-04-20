import { describe, expect, it } from 'vitest';
import { buildEventParticipantSummaryMap } from './eventParticipantSummary';

describe('eventParticipantSummary', () => {
  it('카운트와 내 참여 여부를 이벤트별 요약으로 합친다', () => {
    const summaries = buildEventParticipantSummaryMap({
      eventIds: ['event-1', 'event-2', 'event-3'],
      countRows: [
        { event_id: 'event-1' },
        { event_id: 'event-1' },
        { event_id: 'event-1' },
        { event_id: 'event-1' },
        { event_id: 'event-1' },
      ],
      viewerRows: [{ event_id: 'event-2' }],
      hasExactParticipantCount: true,
    });

    expect(summaries).toEqual({
      'event-1': { eventId: 'event-1', participantCount: 5, viewerJoined: false, hasExactParticipantCount: true },
      'event-2': { eventId: 'event-2', participantCount: 0, viewerJoined: true, hasExactParticipantCount: true },
      'event-3': { eventId: 'event-3', participantCount: 0, viewerJoined: false, hasExactParticipantCount: true },
    });
  });

  it('정확한 집계가 없으면 플래그를 false로 유지한다', () => {
    const summaries = buildEventParticipantSummaryMap({
      eventIds: ['event-1'],
      countRows: [],
      viewerRows: [{ event_id: 'event-1' }],
      hasExactParticipantCount: false,
    });

    expect(summaries['event-1']).toEqual({
      eventId: 'event-1',
      participantCount: 0,
      viewerJoined: true,
      hasExactParticipantCount: false,
    });
  });
});

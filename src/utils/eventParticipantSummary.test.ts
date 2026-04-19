import { describe, expect, it } from 'vitest';
import { buildEventParticipantSummaryMap } from './eventParticipantSummary';

describe('eventParticipantSummary', () => {
  it('카운트와 내 참여 여부를 이벤트별 요약으로 합친다', () => {
    const summaries = buildEventParticipantSummaryMap({
      eventIds: ['event-1', 'event-2', 'event-3'],
      countRows: [
        { event_id: 'event-1', participant_count: 5 },
        { event_id: 'event-2', participant_count: 0 },
      ],
      viewerRows: [{ event_id: 'event-2' }],
    });

    expect(summaries).toEqual({
      'event-1': { eventId: 'event-1', participantCount: 5, viewerJoined: false },
      'event-2': { eventId: 'event-2', participantCount: 0, viewerJoined: true },
      'event-3': { eventId: 'event-3', participantCount: 0, viewerJoined: false },
    });
  });
});

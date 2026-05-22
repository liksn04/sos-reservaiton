import { useMemo } from 'react';
import type { ClubEventWithDetails, EventParticipantSummary } from '../types';

type Tab = 'upcoming' | 'past' | 'timeline';

interface UseFilteredEventsArgs {
  events: ClubEventWithDetails[];
  participantSummaryMap: Record<string, EventParticipantSummary>;
  filterCategory: string | null;
  tab: Tab;
  today: string;
}

function attachSummary(
  event: ClubEventWithDetails,
  participantSummaryMap: Record<string, EventParticipantSummary>,
): ClubEventWithDetails {
  return {
    ...event,
    participantSummary: participantSummaryMap[event.id] ?? {
      eventId: event.id,
      participantCount: 0,
      viewerJoined: false,
      hasExactParticipantCount: false,
    },
  };
}

function matchesTab(event: ClubEventWithDetails, tab: Tab, today: string): boolean {
  if (tab === 'timeline') return true;
  const lastDay = event.end_date ?? event.start_date;
  return tab === 'upcoming' ? lastDay >= today : lastDay < today;
}

function compareForTab(tab: Tab) {
  const direction = tab === 'upcoming' ? 1 : -1;
  return (a: ClubEventWithDetails, b: ClubEventWithDetails): number => {
    const byDate = a.start_date.localeCompare(b.start_date);
    if (byDate !== 0) return byDate * direction;
    return (a.start_time ?? '').localeCompare(b.start_time ?? '');
  };
}

export function useFilteredEvents({
  events,
  participantSummaryMap,
  filterCategory,
  tab,
  today,
}: UseFilteredEventsArgs): ClubEventWithDetails[] {
  return useMemo(() => {
    const result: ClubEventWithDetails[] = [];
    for (const event of events) {
      if (filterCategory && event.category_id !== filterCategory) continue;
      if (!matchesTab(event, tab, today)) continue;
      result.push(attachSummary(event, participantSummaryMap));
    }
    result.sort(compareForTab(tab));
    return result;
  }, [events, participantSummaryMap, filterCategory, tab, today]);
}

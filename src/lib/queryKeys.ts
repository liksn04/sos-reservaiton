/**
 * 모든 React Query 키를 중앙에서 관리합니다.
 * useQuery / invalidateQueries 호출 시 반드시 이 객체를 사용하세요.
 */
export const queryKeys = {
  reservations: {
    all: ['reservations'] as const,
    policySeasons: {
      all: ['reservation_policy_seasons'] as const,
      list: (scope: 'all' | 'active') => ['reservation_policy_seasons', scope] as const,
    },
  },

  events: {
    all: ['club_events'] as const,
    categories: ['event_categories'] as const,
    summaries: {
      all: ['event_participant_summaries'] as const,
      list: (eventIds: readonly string[]) => ['event_participant_summaries', ...eventIds] as const,
    },
    participants: {
      all: ['event_participants'] as const,
      byEvent: (eventId: string) => ['event_participants', eventId] as const,
    },
  },

  budget: {
    all: ['budget_transactions'] as const,
    list: (year?: number, half?: 1 | 2) => ['budget_transactions', year, half] as const,
    categories: ['budget_categories'] as const,
    stats: (year: number) => ['budget_stats', year] as const,
    availableYears: ['budget_available_years'] as const,
    fees: {
      all: ['membership_fees'] as const,
      policy: (year: number, half: 1 | 2) => ['membership_fees', 'policy', year, half] as const,
      records: (year: number, half: 1 | 2) => ['membership_fees', 'records', year, half] as const,
    },
  },

  admin: {
    all: ['admin'] as const,
    counts: ['admin', 'counts'] as const,
    approved: ['admin', 'approved'] as const,
    banned: ['admin', 'banned'] as const,
    logs: ['admin', 'logs'] as const,
    reservationPolicySeasons: ['admin', 'reservation_policy_seasons'] as const,
  },

  members: ['members'] as const,
} as const;

/**
 * 모든 React Query 키를 중앙에서 관리합니다.
 * useQuery / invalidateQueries 호출 시 반드시 이 객체를 사용하세요.
 */
export const queryKeys = {
  reservations: {
    all: ['reservations'] as const,
  },

  events: {
    all: ['club_events'] as const,
    categories: ['event_categories'] as const,
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
      policy: (year: number, half: 1 | 2) => ['membership_fee_policy', year, half] as const,
      records: (year: number, half: 1 | 2) => ['membership_fee_records', year, half] as const,
    },
  },

  admin: {
    all: ['admin'] as const,
    counts: ['admin', 'counts'] as const,
    pending: ['admin', 'pending'] as const,
    approved: ['admin', 'approved'] as const,
    banned: ['admin', 'banned'] as const,
    logs: ['admin', 'logs'] as const,
  },

  members: ['members'] as const,
} as const;

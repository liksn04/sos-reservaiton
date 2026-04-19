import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { markReservationPolicyTableMissing } from '../utils/reservationPolicyFeature';
import type { ReservationPolicySeason } from '../types';

export async function fetchReservationPolicySeasons(includeInactive = false) {
  let query = supabase
    .from('reservation_policy_seasons')
    .select('*')
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    if (markReservationPolicyTableMissing(error)) {
      return [];
    }

    throw error;
  }

  return (data ?? []) as ReservationPolicySeason[];
}

interface UseReservationPolicySeasonsOptions {
  includeInactive?: boolean;
}

export function useReservationPolicySeasons(
  options: UseReservationPolicySeasonsOptions = {},
) {
  const includeInactive = options.includeInactive ?? false;

  return useQuery<ReservationPolicySeason[]>({
    queryKey: queryKeys.reservations.policySeasons.list(includeInactive ? 'all' : 'active'),
    queryFn: () => fetchReservationPolicySeasons(includeInactive),
    staleTime: 60_000,
  });
}

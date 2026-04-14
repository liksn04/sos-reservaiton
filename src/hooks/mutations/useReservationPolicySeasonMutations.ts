import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { normalizeReservationPolicyFeatureError } from '../../utils/reservationPolicyFeature';
import { sanitizeReservationPolicySeasonInput } from '../../utils/reservationPolicy';
import type { ReservationPolicySeasonInput } from '../../types';

async function getAuthenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('인증 정보가 없습니다.');

  return user.id;
}

function invalidateReservationPolicyQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.reservations.policySeasons.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.reservationPolicySeasons });
}

export function useCreateReservationPolicySeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ReservationPolicySeasonInput) => {
      const userId = await getAuthenticatedUserId();
      const sanitized = sanitizeReservationPolicySeasonInput(payload);

      const { error } = await supabase.from('reservation_policy_seasons').insert({
        ...sanitized,
        created_by: userId,
      });

      if (error) throw normalizeReservationPolicyFeatureError(error);
    },
    onSuccess: () => invalidateReservationPolicyQueries(queryClient),
  });
}

interface UpdateReservationPolicySeasonPayload extends ReservationPolicySeasonInput {
  id: string;
}

export function useUpdateReservationPolicySeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateReservationPolicySeasonPayload) => {
      const sanitized = sanitizeReservationPolicySeasonInput(payload);

      const { error } = await supabase
        .from('reservation_policy_seasons')
        .update(sanitized)
        .eq('id', id);

      if (error) throw normalizeReservationPolicyFeatureError(error);
    },
    onSuccess: () => invalidateReservationPolicyQueries(queryClient),
  });
}

export function useDeleteReservationPolicySeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservation_policy_seasons')
        .delete()
        .eq('id', id);

      if (error) throw normalizeReservationPolicyFeatureError(error);
    },
    onSuccess: () => invalidateReservationPolicyQueries(queryClient),
  });
}

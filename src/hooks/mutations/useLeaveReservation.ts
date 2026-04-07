import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';

interface LeavePayload {
  reservationId: string;
  userId: string;
}

export function useLeaveReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, userId }: LeavePayload) => {
      const { error } = await supabase
        .from('reservation_invitees')
        .delete()
        .eq('reservation_id', reservationId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

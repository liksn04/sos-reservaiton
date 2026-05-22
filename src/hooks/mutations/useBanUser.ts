import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { banUser } from '../../services/adminService';

interface BanPayload {
  userId: string;
  userName: string;
  reason?: string;
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, reason }: BanPayload) => {
      await banUser(userId, userName, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.banned });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

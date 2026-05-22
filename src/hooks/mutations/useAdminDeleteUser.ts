import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { deleteAdminUser } from '../../services/adminService';

interface AdminDeletePayload {
  userId: string;
  userName: string;
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName }: AdminDeletePayload) => {
      return deleteAdminUser(userId, userName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.banned });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

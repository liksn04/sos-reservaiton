import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { setAdminRole } from '../../services/adminService';

interface SetAdminRolePayload {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

export function useSetAdminRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, isAdmin }: SetAdminRolePayload) => {
      await setAdminRole(userId, userName, isAdmin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

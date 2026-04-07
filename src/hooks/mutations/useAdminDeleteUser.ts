import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface AdminDeletePayload {
  userId: string;
  userName: string;
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName }: AdminDeletePayload) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { targetUserId: userId, targetName: userName },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'banned'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] });
    },
  });
}

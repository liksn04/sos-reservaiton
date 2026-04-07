import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { ProfileStatus } from '../../types';

interface StatusPayload {
  userId: string;
  userName: string;
  status: Extract<ProfileStatus, 'approved' | 'rejected'>;
}

export function useUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, status }: StatusPayload) => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. 상태 업데이트
      const { error } = await supabase.from('profiles')
        .update({ status })
        .eq('id', userId);
      if (error) throw error;

      // 2. 감사 로그 (관리자 세션이 있는 경우)
      if (user) {
        const { data: adminProfile } = await supabase
          .from('profiles').select('display_name').eq('id', user.id).single();
        await supabase.from('admin_action_log').insert({
          admin_id:    user.id,
          admin_name:  adminProfile?.display_name ?? null,
          target_id:   userId,
          target_name: userName,
          action:      status === 'approved' ? 'approve' : 'reject',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pending });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

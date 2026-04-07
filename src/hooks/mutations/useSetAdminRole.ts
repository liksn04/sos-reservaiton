import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface SetAdminRolePayload {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

export function useSetAdminRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, isAdmin }: SetAdminRolePayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      // 1. 어드민 권한 업데이트
      const { error } = await supabase.from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId);
      if (error) throw error;

      // 2. 감사 로그
      const { data: adminProfile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single();
      await supabase.from('admin_action_log').insert({
        admin_id:    user.id,
        admin_name:  adminProfile?.display_name ?? null,
        target_id:   userId,
        target_name: userName,
        action:      isAdmin ? 'promote' : 'demote',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] });
    },
  });
}

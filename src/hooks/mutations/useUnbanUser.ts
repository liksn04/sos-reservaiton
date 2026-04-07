import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';

interface UnbanPayload {
  userId: string;
  userName: string;
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName }: UnbanPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      // 1. 프로필 복원
      const { error } = await supabase.from('profiles').update({
        status:        'approved',
        banned_at:     null,
        banned_reason: null,
        banned_by:     null,
      }).eq('id', userId);
      if (error) throw error;

      // 2. 감사 로그
      const { data: adminProfile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single();
      await supabase.from('admin_action_log').insert({
        admin_id:    user.id,
        admin_name:  adminProfile?.display_name ?? null,
        target_id:   userId,
        target_name: userName,
        action:      'unban',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.banned });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

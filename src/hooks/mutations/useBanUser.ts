import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';

interface BanPayload {
  userId: string;
  userName: string;
  reason?: string;
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, reason }: BanPayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      // 1. 프로필 ban 처리
      const { error } = await supabase.from('profiles').update({
        status:        'banned',
        banned_at:     new Date().toISOString(),
        banned_reason: reason ?? null,
        banned_by:     user.id,
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
        action:      'ban',
        reason:      reason ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.banned });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { MemberRole } from '../../types';

interface SetAdminRolePayload {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

interface SetMemberRolePayload {
  userId: string;
  userName: string;
  memberRole: MemberRole;
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
    },
  });
}

export function useSetMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userName, memberRole }: SetMemberRolePayload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      const { error } = await supabase
        .from('profiles')
        .update({ member_role: memberRole })
        .eq('id', userId);
      if (error) throw error;

      const { data: adminProfile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single();
      await supabase.from('admin_action_log').insert({
        admin_id:    user.id,
        admin_name:  adminProfile?.display_name ?? null,
        target_id:   userId,
        target_name: userName,
        action:      'promote',
        reason:      `role:${memberRole}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.logs });
      queryClient.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}

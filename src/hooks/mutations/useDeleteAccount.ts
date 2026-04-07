import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

/**
 * 회원 탈퇴 뮤테이션
 * - Supabase Edge Function `delete-account` 호출
 * - 서버에서 auth.users 삭제 → CASCADE로 profiles / reservations 모두 정리
 * - 성공 후 클라이언트 세션 만료 처리는 호출부에서 signOut() 으로 진행
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (reason?: string) => {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { reason: reason ?? null },
      });
      if (error) throw error;
      return data;
    },
  });
}

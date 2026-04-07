import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUnbanUser } from '../../hooks/mutations/useUnbanUser';
import AdminUserCard from './AdminUserCard';
import type { Profile } from '../../types';

export default function BannedTab() {
  const unbanUser = useUnbanUser();

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin', 'banned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('status', 'banned')
        .order('banned_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  async function handleUnban(user: Profile) {
    if (!confirm(`[${user.display_name}] 님의 차단을 해제하시겠습니까?`)) return;
    try {
      await unbanUser.mutateAsync({ userId: user.id, userName: user.display_name });
    } catch { alert('차단 해제에 실패했습니다.'); }
  }

  if (isLoading) {
    return (
      <div className="empty-card flex-col gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p>목록을 불러오는 중...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="empty-card flex-col gap-4">
        <span className="material-symbols-outlined text-4xl opacity-30">check_circle</span>
        <p>차단된 회원이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <AdminUserCard
          key={user.id}
          user={user}
          badge={
            <span className="text-[9px] bg-error/20 text-error px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
              BANNED
            </span>
          }
          meta={
            user.banned_reason ? (
              <p className="text-xs text-error/70 mt-1 font-medium truncate">
                사유: {user.banned_reason}
              </p>
            ) : null
          }
          actions={
            <button
              onClick={() => handleUnban(user)}
              disabled={unbanUser.isPending}
              className="px-4 h-10 rounded-xl text-sm font-bold flex items-center gap-1.5 bg-surface-container text-on-surface-variant border border-outline-variant/20 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
            >
              {unbanUser.isPending
                ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                : <><span className="material-symbols-outlined text-[16px]">lock_open</span>차단 해제</>}
            </button>
          }
        />
      ))}
    </div>
  );
}

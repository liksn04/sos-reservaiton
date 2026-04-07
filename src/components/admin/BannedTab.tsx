import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useUnbanUser } from '../../hooks/mutations/useUnbanUser';
import AdminUserCard from './AdminUserCard';
import type { Profile } from '../../types';

export default function BannedTab() {
  const unbanUser = useUnbanUser();

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: queryKeys.admin.banned,
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
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">목록을 불러오는 중...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 opacity-60">
        <span className="material-symbols-outlined text-5xl opacity-20">check_circle</span>
        <p className="text-sm font-bold">차단된 회원이 없습니다.</p>
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
            <span className="text-[9px] bg-error/10 text-error px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
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
              className="bg-surface-container-highest border border-card-border text-on-surface text-[13px] font-black px-5 h-11 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              {unbanUser.isPending
                ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                : <><span className="material-symbols-outlined text-[18px]">lock_open</span>차단 해제</>}
            </button>
          }
        />
      ))}
    </div>
  );
}

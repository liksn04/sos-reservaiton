import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBanUser } from '../../hooks/mutations/useBanUser';
import { useSetAdminRole } from '../../hooks/mutations/useSetAdminRole';
import { useAdminDeleteUser } from '../../hooks/mutations/useAdminDeleteUser';
import AdminUserCard from './AdminUserCard';
import BanDialog from './BanDialog';
import type { Profile } from '../../types';

export default function MembersTab() {
  const { profile: me } = useAuth();
  const banUser       = useBanUser();
  const setAdminRole  = useSetAdminRole();
  const deleteUser    = useAdminDeleteUser();

  const [banTarget, setBanTarget]   = useState<Profile | null>(null);
  const [search, setSearch]         = useState('');

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin', 'approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const filtered = users.filter((u) =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.part ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  async function handleToggleAdmin(user: Profile) {
    const action = user.is_admin ? '어드민 해제' : '어드민 지정';
    if (!confirm(`[${user.display_name}] 님을 ${action}하시겠습니까?`)) return;
    try {
      await setAdminRole.mutateAsync({
        userId: user.id, userName: user.display_name, isAdmin: !user.is_admin,
      });
    } catch { alert('처리에 실패했습니다.'); }
  }

  async function handleDelete(user: Profile) {
    if (user.id === me?.id) { alert('본인 계정은 삭제할 수 없습니다.'); return; }
    if (!confirm(`[${user.display_name}] 님의 계정을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await deleteUser.mutateAsync({ userId: user.id, userName: user.display_name });
    } catch { alert('삭제에 실패했습니다.'); }
  }

  if (isLoading) return <LoadingCard />;

  return (
    <>
      {/* 검색 */}
      <div className="form-group mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="이름 또는 파트로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-card flex-col gap-4">
          <span className="material-symbols-outlined text-4xl opacity-30">group_off</span>
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              actions={
                <div className="flex flex-col gap-1.5">
                  {/* 어드민 토글 */}
                  <button
                    title={user.is_admin ? '어드민 해제' : '어드민 지정'}
                    onClick={() => handleToggleAdmin(user)}
                    disabled={setAdminRole.isPending || user.id === me?.id}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border ${
                      user.is_admin
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {user.is_admin ? 'shield' : 'shield_with_heart'}
                    </span>
                  </button>

                  {/* 차단 */}
                  <button
                    title="차단"
                    onClick={() => setBanTarget(user)}
                    disabled={banUser.isPending || user.id === me?.id}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant border border-outline-variant/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                  </button>

                  {/* 삭제 */}
                  <button
                    title="계정 삭제"
                    onClick={() => handleDelete(user)}
                    disabled={deleteUser.isPending || user.id === me?.id}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container text-on-surface-variant border border-outline-variant/10 hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* 차단 다이얼로그 */}
      <BanDialog
        isOpen={!!banTarget}
        userName={banTarget?.display_name ?? ''}
        isPending={banUser.isPending}
        onClose={() => setBanTarget(null)}
        onConfirm={async (reason) => {
          if (!banTarget) return;
          try {
            await banUser.mutateAsync({
              userId: banTarget.id, userName: banTarget.display_name, reason,
            });
            setBanTarget(null);
          } catch { alert('차단에 실패했습니다.'); }
        }}
      />
    </>
  );
}

function LoadingCard() {
  return (
    <div className="empty-card flex-col gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p>목록을 불러오는 중...</p>
    </div>
  );
}

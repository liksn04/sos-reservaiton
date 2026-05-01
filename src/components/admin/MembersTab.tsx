import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { useBanUser } from '../../hooks/mutations/useBanUser';
import { useSetAdminRole, useSetMemberRole } from '../../hooks/mutations/useSetAdminRole';
import { useAdminDeleteUser } from '../../hooks/mutations/useAdminDeleteUser';
import AdminUserCard from './AdminUserCard';
import BanDialog from './BanDialog';
import { MEMBER_ROLE_LABELS } from '../../utils/roles';
import type { MemberRole, Profile } from '../../types';

export default function MembersTab() {
  const { profile: me } = useAuth();
  const banUser       = useBanUser();
  const setAdminRole  = useSetAdminRole();
  const setMemberRole = useSetMemberRole();
  const deleteUser    = useAdminDeleteUser();

  const [banTarget, setBanTarget]   = useState<Profile | null>(null);
  const [search, setSearch]         = useState('');

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: queryKeys.admin.approved,
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
    (u.part || []).some((p) => p.toLowerCase().includes(search.toLowerCase())),
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

  async function handleChangeMemberRole(user: Profile, memberRole: MemberRole) {
    if (user.member_role === memberRole) return;
    if (!confirm(`[${user.display_name}] 님의 역할을 [${MEMBER_ROLE_LABELS[memberRole]}](으)로 변경하시겠습니까?`)) return;
    try {
      await setMemberRole.mutateAsync({
        userId: user.id,
        userName: user.display_name,
        memberRole,
      });
    } catch {
      alert('역할 변경에 실패했습니다.');
    }
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
      <div className="mb-6">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px] transition-colors group-focus-within:text-primary">
            search
          </span>
          <input
            type="text"
            placeholder="이름 또는 파트로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-card-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 opacity-60">
          <span className="material-symbols-outlined text-5xl opacity-20">group_off</span>
          <p className="text-sm font-bold">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((user) => (
            <AdminUserCard
              key={user.id}
              user={user}
              actions={
                  <div className="flex items-center gap-2">
                    <select
                      title="운영 역할"
                      value={user.member_role ?? 'member'}
                      onChange={(event) => handleChangeMemberRole(user, event.target.value as MemberRole)}
                      disabled={setMemberRole.isPending || user.id === me?.id}
                      className="h-10 max-w-[104px] rounded-2xl border border-card-border bg-surface-container-highest px-2 text-[11px] font-bold text-on-surface-variant"
                    >
                      {(Object.keys(MEMBER_ROLE_LABELS) as MemberRole[]).map((role) => (
                        <option key={role} value={role}>
                          {MEMBER_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>

                    {/* 어드민 토글 */}
                    <button
                      title={user.is_admin ? '어드민 해제' : '어드민 지정'}
                      onClick={() => handleToggleAdmin(user)}
                      disabled={setAdminRole.isPending || user.id === me?.id}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border ${
                        user.is_admin
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-surface-container-highest text-on-surface-variant border-card-border hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {user.is_admin ? 'shield' : 'shield_with_heart'}
                      </span>
                    </button>

                    {/* 차단 */}
                    <button
                      title="차단"
                      onClick={() => setBanTarget(user)}
                      disabled={banUser.isPending || user.id === me?.id}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-surface-container-highest text-on-surface-variant border border-card-border hover:bg-error/10 hover:text-error hover:border-error/20 transition-all px-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">block</span>
                    </button>

                    {/* 삭제 */}
                    <button
                      title="계정 삭제"
                      onClick={() => handleDelete(user)}
                      disabled={deleteUser.isPending || user.id === me?.id}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center bg-surface-container-highest text-on-surface-variant border border-card-border hover:bg-error/10 hover:text-error hover:border-error/20 transition-all px-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
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
    <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-bold opacity-60">목록을 불러오는 중...</p>
    </div>
  );
}

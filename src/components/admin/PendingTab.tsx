import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useUserStatusMutation } from '../../hooks/mutations/useUserStatusMutation';
import AdminUserCard from './AdminUserCard';
import type { Profile } from '../../types';

export default function PendingTab() {
  const { profile: me } = useAuth();
  const updateStatus = useUserStatusMutation();
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  async function handleAction(user: Profile, action: 'approved' | 'rejected') {
    setActionUserId(user.id);
    try {
      await updateStatus.mutateAsync({ userId: user.id, userName: user.display_name, status: action });
    } catch {
      alert('상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setActionUserId(null);
    }
  }

  if (isLoading) return <LoadingCard />;
  if (users.length === 0) {
    return (
      <div className="empty-card flex-col gap-4">
        <span className="material-symbols-outlined text-4xl opacity-30">check_circle</span>
        <p>승인 대기 중인 사용자가 없습니다.</p>
      </div>
    );
  }

  const isPending = (id: string) => actionUserId === id && updateStatus.isPending;

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <AdminUserCard
          key={user.id}
          user={user}
          actions={
            <>
              <button
                className="error-btn px-3 h-10 text-sm flex items-center gap-1.5"
                disabled={updateStatus.isPending || user.id === me?.id}
                onClick={() => handleAction(user, 'rejected')}
              >
                {isPending(user.id)
                  ? <div className="w-4 h-4 border-2 border-error/20 border-t-error rounded-full animate-spin" />
                  : '거절'}
              </button>
              <button
                className="primary-btn px-5 h-10 text-sm flex items-center gap-1.5"
                disabled={updateStatus.isPending || user.id === me?.id}
                onClick={() => handleAction(user, 'approved')}
              >
                {isPending(user.id)
                  ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <><span className="material-symbols-outlined text-[16px]">check</span>승인</>}
              </button>
            </>
          }
        />
      ))}
    </div>
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

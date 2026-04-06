import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';

export default function Admin() {
  const navigate = useNavigate();
  const { profile: me } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchPending(showLoader = true) {
    if (showLoader) setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPendingUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { 
    fetchPending(false); 
  }, []);

  async function handleAction(userId: string, action: 'approved' | 'rejected') {
    setActionLoading(userId);
    try {
      await supabase
        .from('profiles')
        .update({ status: action })
        .eq('id', userId);
      await fetchPending(false);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="app-shell">
      {/* Top App Bar with Back Button */}
      <header className="top-app-bar" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="logo-area">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-bright transition-colors text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black tracking-widest uppercase">Admin Panel</span>
        </div>
      </header>

      <main className="shell-main">
        <div className="animate-slide-up">
          <div className="club-tag">SOUND OF SHINE</div>
          <h1 className="dashboard-title">
            <span className="text-gradient-white-purple">빛소리 관리자</span>
          </h1>
          <p className="dashboard-subtitle">
            새로운 회원들의 가입 요청을 검토하고 승인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <h3 className="text-sm font-bold text-on-surface-variant flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            승인 대기 목록 ({pendingUsers.length})
          </h3>

          {loading ? (
            <div className="empty-card flex-col gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p>목록을 불러오는 중입니다...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="empty-card flex-col gap-4">
              <span className="material-symbols-outlined text-4xl opacity-30">check_circle</span>
              <p>현재 승인 대기 중인 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingUsers.map((user) => (
                <div key={user.id} className="glass-card rounded-[2rem] p-5 flex items-center gap-4 animate-fade-in-up">
                  {/* User Avatar */}
                  <div className="w-14 h-14 bg-surface-bright rounded-[1.25rem] overflow-hidden flex-shrink-0 border border-outline-variant/30 relative">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-40">
                        <span className="material-symbols-outlined text-[28px]">person</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-on-surface truncate">
                      {user.display_name || '(닉네임 미설정)'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {user.part ?? '파트 미설정'}
                      </span>
                      <span className="text-xs text-on-surface-variant line-clamp-1">
                        {user.bio || '한줄소개가 없습니다.'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="error-btn px-4 h-11 text-sm flex items-center justify-center gap-2"
                      disabled={!!actionLoading || user.id === me?.id}
                      onClick={() => handleAction(user.id, 'rejected')}
                    >
                      {actionLoading === user.id ? <div className="w-4 h-4 border-2 border-error/20 border-t-error rounded-full animate-spin" /> : '거절'}
                    </button>
                    <button
                      className="primary-btn px-6 h-11 text-sm flex items-center justify-center gap-2"
                      disabled={!!actionLoading || user.id === me?.id}
                      onClick={() => handleAction(user.id, 'approved')}
                    >
                      {actionLoading === user.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : '승인'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types';

export default function Admin() {
  const { profile: me } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchPending() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPendingUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchPending(); }, []);

  async function handleAction(userId: string, action: 'approved' | 'rejected') {
    setActionLoading(userId);
    await supabase
      .from('profiles')
      .update({ status: action })
      .eq('id', userId);
    await fetchPending();
    setActionLoading(null);
  }

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="header-content">
          <div className="logo">
            <i className="fa-solid fa-music" />
            빛소리 동아리방 <span>관리자</span>
          </div>
          <span className="badge">승인 대기 목록</span>
        </div>
      </header>

      <div className="glass-card">
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : pendingUsers.length === 0 ? (
          <div className="empty-state">
            <i className="fa-regular fa-circle-check" />
            <p>승인 대기 중인 사용자가 없습니다.</p>
          </div>
        ) : (
          <ul className="admin-list">
            {pendingUsers.map((user) => (
              <li key={user.id} className="admin-item">
                <div className="admin-item-info">
                  <div className="avatar-sm">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} />
                    ) : (
                      <i className="fa-solid fa-user" />
                    )}
                  </div>
                  <div>
                    <strong>{user.display_name || '(닉네임 미설정)'}</strong>
                    <span className="text-muted">
                      {user.part ?? '파트 미설정'} · {user.bio || '한줄소개 없음'}
                    </span>
                  </div>
                </div>
                <div className="admin-item-actions">
                  <button
                    className="primary-btn"
                    disabled={actionLoading === user.id || user.id === me?.id}
                    onClick={() => handleAction(user.id, 'approved')}
                  >
                    승인
                  </button>
                  <button
                    className="delete-res-btn"
                    disabled={actionLoading === user.id || user.id === me?.id}
                    onClick={() => handleAction(user.id, 'rejected')}
                  >
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

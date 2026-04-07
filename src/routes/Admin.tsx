import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import PendingTab from '../components/admin/PendingTab';
import MembersTab from '../components/admin/MembersTab';
import BannedTab  from '../components/admin/BannedTab';
import LogsTab    from '../components/admin/LogsTab';

type AdminTab = 'pending' | 'members' | 'banned' | 'logs';

interface TabCount {
  pending: number;
  banned: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  // 배지 카운트용 쿼리
  const { data: counts } = useQuery<TabCount>({
    queryKey: ['admin', 'counts'],
    queryFn: async () => {
      const [p, b] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'banned'),
      ]);
      return { pending: p.count ?? 0, banned: b.count ?? 0 };
    },
    refetchInterval: 30_000,
  });

  const TABS: { key: AdminTab; icon: string; label: string; badge?: number }[] = [
    { key: 'pending', icon: 'how_to_reg',  label: '대기중',  badge: counts?.pending },
    { key: 'members', icon: 'groups',      label: '전체 회원' },
    { key: 'banned',  icon: 'block',       label: '차단됨',  badge: counts?.banned },
    { key: 'logs',    icon: 'history',     label: '관리 로그' },
  ];

  return (
    <div className="app-shell">
      {/* Top App Bar */}
      <header className="top-app-bar" style={{ borderBottom: '1px solid var(--card-border)' }}>
        <div className="logo-area">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black tracking-widest uppercase">
            Admin Panel
          </span>
        </div>
      </header>

      <main className="shell-main">
        <div className="animate-slide-up">
          <div className="club-tag">SOUND OF SHINE</div>
          <h1 className="dashboard-title">
            <span className="text-gradient-white-purple">빛소리 관리자</span>
          </h1>

          {/* ── 탭 네비게이션 ── */}
          <div className="flex gap-1 mb-6 bg-surface-container rounded-2xl p-1.5 overflow-x-auto">
            {TABS.map(({ key, icon, label, badge }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex-1 min-w-fit flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-surface-container-highest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                  {/* 배지 */}
                  {badge != null && badge > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-on-primary text-[9px] font-black rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 탭 콘텐츠 ── */}
          <div key={activeTab} className="animate-fade-in-up">
            {activeTab === 'pending'  && <PendingTab />}
            {activeTab === 'members'  && <MembersTab />}
            {activeTab === 'banned'   && <BannedTab />}
            {activeTab === 'logs'     && <LogsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

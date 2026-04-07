import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
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
    queryKey: queryKeys.admin.counts,
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
      <header className="top-app-bar border-b border-card-border">
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
          <div className="club-tag mb-2">SOUND OF SHINE</div>
          <h1 className="dashboard-title mb-8">
            <span className="text-gradient-white-purple">빛소리 관리자</span>
          </h1>

          {/* ── 관리 도구 바로가기 ── */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {/* 예산 관리 카드 */}
            <div 
              onClick={() => navigate('/budget')}
              className="bg-surface-container-low border border-card-border p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl font-black">payments</span>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-black text-on-surface leading-tight">예산 관리</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">FINANCE HUB</p>
              </div>
            </div>

            {/* 행사 관리 카드 */}
            <div 
              onClick={() => navigate('/events')}
              className="bg-surface-container-low border border-card-border p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-secondary text-2xl font-black">event_available</span>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-black text-on-surface leading-tight">행사 관리</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">EVENT HUB</p>
              </div>
            </div>
          </div>

          {/* ── 탭 네비게이션 ── */}
          <div className="flex gap-2 mb-8 bg-surface-container-low p-2 rounded-2xl border border-card-border overflow-x-auto no-scrollbar">
            {TABS.map(({ key, icon, label, badge }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 py-2.5 px-6 rounded-2xl text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-white/5'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                  {/* 배지 */}
                  {badge != null && badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white text-primary' : 'bg-primary text-white'
                    }`}>
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

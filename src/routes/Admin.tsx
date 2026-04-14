import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { adminTabModuleLoaders, prefetchAdminTabModule, prefetchRouteModule, scheduleIdlePrefetch } from '../lib/moduleLoaders';

type AdminTab = 'pending' | 'members' | 'policy' | 'banned' | 'logs';

interface TabCount {
  pending: number;
  banned: number;
}

const ADMIN_TABS: { key: AdminTab; icon: string; label: string; badgeKey?: keyof TabCount }[] = [
  { key: 'pending', icon: 'how_to_reg', label: '대기중', badgeKey: 'pending' },
  { key: 'members', icon: 'groups', label: '전체 회원' },
  { key: 'policy', icon: 'event_upcoming', label: '예약 정책' },
  { key: 'banned', icon: 'block', label: '차단됨', badgeKey: 'banned' },
  { key: 'logs', icon: 'history', label: '관리 로그' },
];

const PendingTab = lazy(adminTabModuleLoaders.pending);
const MembersTab = lazy(adminTabModuleLoaders.members);
const ReservationPolicyTab = lazy(adminTabModuleLoaders.policy);
const BannedTab = lazy(adminTabModuleLoaders.banned);
const LogsTab = lazy(adminTabModuleLoaders.logs);

const ADMIN_TAB_COMPONENTS = {
  pending: PendingTab,
  members: MembersTab,
  policy: ReservationPolicyTab,
  banned: BannedTab,
  logs: LogsTab,
} as const;

function AdminTabFallback() {
  return (
    <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-bold opacity-60">관리 도구를 불러오는 중...</p>
    </div>
  );
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

  const ActiveTabComponent = ADMIN_TAB_COMPONENTS[activeTab];

  useEffect(() => {
    const tabsToPrefetch = ADMIN_TABS
      .map((tab) => tab.key)
      .filter((tab): tab is AdminTab => tab !== activeTab);

    const cancelPrefetch = scheduleIdlePrefetch(() => {
      tabsToPrefetch.forEach((tab) => {
        void prefetchAdminTabModule(tab);
      });
    }, 400);

    return cancelPrefetch;
  }, [activeTab]);

  return (
    <div className="app-shell">
      <header className="top-app-bar">
        <div className="logo-area">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-surface-container-lowest border border-card-border hover:bg-surface-container-high transition-colors text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <span className="logo-text">관리자 패널</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="soft-chip active !px-4 !py-2">
            운영 모드
          </span>
        </div>
      </header>

      <main className="shell-main">
        <div className="animate-slide-up">
          <div className="club-tag mb-2">운영 도구</div>
          <h1 className="dashboard-title mb-8">
            <span className="text-gradient-white-purple">빛소리 관리자</span>
          </h1>

          {/* ── 관리 도구 바로가기 ── */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {/* 예산 관리 카드 */}
            <div 
              onClick={() => navigate('/budget')}
              onPointerEnter={() => { void prefetchRouteModule('/budget'); }}
              onFocus={() => { void prefetchRouteModule('/budget'); }}
              onTouchStart={() => { void prefetchRouteModule('/budget'); }}
              className="p-6 rounded-[2rem] relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all text-white"
              style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-white text-2xl font-black">payments</span>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-black leading-tight">예산 관리</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">FINANCE HUB</p>
              </div>
            </div>

            {/* 행사 관리 카드 */}
            <div 
              onClick={() => navigate('/events')}
              onPointerEnter={() => { void prefetchRouteModule('/events'); }}
              onFocus={() => { void prefetchRouteModule('/events'); }}
              onTouchStart={() => { void prefetchRouteModule('/events'); }}
              className="surface-card p-6 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl font-black">event_available</span>
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-black text-on-surface leading-tight">행사 관리</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">EVENT HUB</p>
              </div>
            </div>
          </div>

          {/* ── 탭 네비게이션 ── */}
          <div className="segmented-control mb-8 flex w-full overflow-x-auto no-scrollbar">
            {ADMIN_TABS.map(({ key, icon, label, badgeKey }) => {
              const isActive = activeTab === key;
              const badge = badgeKey ? counts?.[badgeKey] : undefined;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  onPointerEnter={() => { void prefetchAdminTabModule(key); }}
                  onFocus={() => { void prefetchAdminTabModule(key); }}
                  onTouchStart={() => { void prefetchAdminTabModule(key); }}
                  className={`segmented-option relative flex-1 whitespace-nowrap ${isActive ? 'active' : ''}`}
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
            <Suspense fallback={<AdminTabFallback />}>
              <ActiveTabComponent />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

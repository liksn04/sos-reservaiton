import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { prefetchRouteModule, scheduleIdlePrefetch } from '../lib/moduleLoaders';

const TABS = [
  { to: '/',        icon: 'home',           label: '홈',      end: true  },
  { to: '/reserve', icon: 'add_box',        label: '예약',    end: false },
  { to: '/events',  icon: 'calendar_month', label: '일정',    end: false },
  { to: '/profile', icon: 'person',         label: '프로필',  end: false },
] as const;

export default function BottomNav() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pathsToPrefetch = TABS
      .map((tab) => tab.to)
      .filter((path): path is (typeof TABS)[number]['to'] => path !== pathname);

    const cancelPrefetch = scheduleIdlePrefetch(() => {
      pathsToPrefetch.forEach((path) => {
        void prefetchRouteModule(path, { respectHeavyRouteBudget: true });
      });
    });

    return cancelPrefetch;
  }, [pathname]);

  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onPointerEnter={() => { void prefetchRouteModule(to); }}
          onFocus={() => { void prefetchRouteModule(to); }}
          onTouchStart={() => { void prefetchRouteModule(to); }}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined font-bold text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

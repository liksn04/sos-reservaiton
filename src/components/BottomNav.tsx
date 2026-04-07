import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/',        icon: 'home',    label: '홈',      end: true  },
  { to: '/reserve', icon: 'add_box', label: '예약하기', end: false },
  { to: '/profile', icon: 'person',  label: '프로필',   end: false },
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface max-w-2xl mx-auto right-0 border-t border-white/5">
      {TABS.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all p-2 rounded-xl ${
              isActive ? 'text-primary' : 'text-gray-500 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined font-bold"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="text-[10px] font-bold mt-1">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

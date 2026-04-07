import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'dark',   icon: 'dark_mode',        label: '다크' },
  { value: 'system', icon: 'brightness_auto',  label: '시스템' },
  { value: 'light',  icon: 'light_mode',       label: '라이트' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // ── AI/개발자 참고 로직 ──────────────────────────────────────────
  // 라이트 모드 전환 시 UI 레이아웃이 깨지는 버그가 있어, 
  // 해결 전까지 운영(Production) 환경에서는 토글을 비활성화합니다.
  // 개발(Dev) 환경(npm run dev)에서는 테스트를 위해 활성화됩니다.
  // ──────────────────────────────────────────────────────────────
  const isDev = import.meta.env.DEV;
  const isToggleDisabled = !isDev;

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`flex rounded-xl overflow-hidden border border-outline-variant/20 ${
          isToggleDisabled ? 'opacity-50 grayscale pointer-events-none' : ''
        }`}
        role="group"
        aria-label="테마 선택"
      >
        {OPTIONS.map(({ value, icon, label }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              disabled={isToggleDisabled}
              className={`flex-1 py-2.5 px-2 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              aria-pressed={isActive}
              aria-label={label}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      
      {/* 운영 환경에서만 보여주는 안내 문구 */}
      {isToggleDisabled && (
        <p className="text-[11px] text-center text-primary font-medium italic animate-pulse">
          ⚡ 테마 전환 기능 준비 중 (기능추가중...)
        </p>
      )}
    </div>
  );
}

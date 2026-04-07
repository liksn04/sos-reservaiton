import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'dark',   icon: 'dark_mode',       label: '다크' },
  { value: 'system', icon: 'brightness_auto', label: '시스템' },
  { value: 'light',  icon: 'light_mode',      label: '라이트' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex rounded-xl overflow-hidden border border-outline-variant/20"
      role="group"
      aria-label="테마 선택"
    >
      {OPTIONS.map(({ value, icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
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
  );
}

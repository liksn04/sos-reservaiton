/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** 실제 적용된 모드 ('dark' | 'light') — system 선택 시 OS 설정 반영 */
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sos-theme';

/** OS의 다크 모드 미디어 쿼리 */
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

function getSystemTheme(): 'dark' | 'light' {
  return darkMQ.matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'dark' | 'light') {
  const html = document.documentElement;
  if (resolved === 'light') {
    html.classList.add('light');
  } else {
    html.classList.remove('light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ── AI/개발자 참고 로직 ──────────────────────────────────────────
  // 라이트 모드 전환 시 UI 레이아웃이 깨지는 버그가 있어, 
  // 해결 전까지 운영(Production) 환경에서는 'dark' 테마로 고정합니다.
  // 개발(Dev) 환경(npm run dev)에서는 테스트를 위해 localStorage 설정을 허용합니다.
  // ──────────────────────────────────────────────────────────────
  const isDev = import.meta.env.DEV;

  const [theme, setThemeState] = useState<Theme>(() => {
    if (!isDev) return 'dark'; // 운영 환경에서는 무조건 다크 모드
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark';
  });

  const resolvedTheme: 'dark' | 'light' =
    !isDev ? 'dark' : (theme === 'system' ? getSystemTheme() : theme);

  // 테마 적용
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // system 모드일 때 OS 설정 변경 감지
  useEffect(() => {
    if (theme !== 'system') return;
    const listener = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };
    darkMQ.addEventListener('change', listener);
    return () => darkMQ.removeEventListener('change', listener);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

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
const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

function getSystemTheme(): 'dark' | 'light' {
  return darkMQ.matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'dark' | 'light') {
  const html = document.documentElement;
  // 기존 테마 클래스를 모두 제거한 뒤 정확히 하나만 추가
  html.classList.remove('dark', 'light');
  html.classList.add(resolved);

  // PWA theme-color 메타 업데이트
  const meta = document.getElementById('theme-color-meta');
  if (meta) {
    meta.setAttribute('content', resolved === 'light' ? '#F8F9FF' : '#131316');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark',
  );

  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? getSystemTheme() : theme;

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

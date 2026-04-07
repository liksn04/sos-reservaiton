import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireApproved, RequireAdmin } from './components/RouteGuards';
import { ThemeProvider } from './contexts/ThemeContext';

import Login from './routes/Login';
import PendingApproval from './routes/PendingApproval';
import ProfileSetup from './routes/ProfileSetup';
import AppShell from './routes/AppShell';
import HomeRoute from './routes/HomeRoute';
import Reserve from './routes/Reserve';
import ProfileRoute from './routes/ProfileRoute';
import Admin from './routes/Admin';
import BannedPage from './routes/BannedPage';
import OfflineBanner from './components/OfflineBanner';
import UpdatePrompt from './components/UpdatePrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('💥 Global Error Caught:', event.error);
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-background text-on-surface p-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-black text-error mb-4">CRITICAL ERROR</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">앱 렌더링 중 치명적인 오류가 발생했습니다.<br/>{error?.message}</p>
        <button onClick={() => window.location.reload()} className="primary-btn px-6">새로고침</button>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <OfflineBanner />
      <UpdatePrompt />
      <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 공개 */}
              <Route path="/login" element={<Login />} />

              {/* 로그인 필요 */}
              <Route element={<RequireAuth />}>
                <Route path="/profile/setup" element={<ProfileSetup />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/banned" element={<BannedPage />} />

                {/* 승인된 사용자 전용 — AppShell이 공통 레이아웃 */}
                <Route element={<RequireApproved />}>
                  <Route element={<AppShell />}>
                    <Route index element={<HomeRoute />} />
                    <Route path="reserve" element={<Reserve />} />
                    <Route path="profile" element={<ProfileRoute />} />
                  </Route>

                  {/* 관리자 전용 */}
                  <Route element={<RequireAdmin />}>
                    <Route path="admin" element={<Admin />} />
                  </Route>
                </Route>
              </Route>

              {/* 기타 경로 → 홈 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

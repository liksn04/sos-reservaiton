import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireApproved, RequireAdmin, RequireBudgetManager } from './components/RouteGuards';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import { RealtimeProvider } from './lib/RealtimeProvider';
import { routeModuleLoaders } from './lib/moduleLoaders';

const Login = lazy(routeModuleLoaders.login);
const ProfileSetup = lazy(routeModuleLoaders.profileSetup);
const AppShell = lazy(routeModuleLoaders.appShell);
const HomeRoute = lazy(routeModuleLoaders.home);
const Reserve = lazy(routeModuleLoaders.reserve);
const EventsRoute = lazy(routeModuleLoaders.events);
const BudgetRoute = lazy(routeModuleLoaders.budget);
const ProfileRoute = lazy(routeModuleLoaders.profile);
const Admin = lazy(routeModuleLoaders.admin);
const BannedPage = lazy(routeModuleLoaders.banned);
const OfflineBanner = lazy(routeModuleLoaders.offlineBanner);
const UpdatePrompt = lazy(routeModuleLoaders.updatePrompt);

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

function AppRouteFallback() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-6">
      <div className="surface-card w-full max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-primary/25 border-t-primary animate-spin" />
        <p className="font-headline text-lg font-bold tracking-tight">화면을 불러오는 중입니다</p>
        <p className="mt-2 text-sm text-on-surface-variant">필요한 화면 코드만 순차적으로 로드하고 있어요.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={null}>
        <OfflineBanner />
      </Suspense>
      <Suspense fallback={null}>
        <UpdatePrompt />
      </Suspense>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RealtimeProvider>
              <BrowserRouter>
                <Suspense fallback={<AppRouteFallback />}>
                  <Routes>
                    {/* ... routes ... */}
                    <Route path="/login" element={<Login />} />
                    <Route element={<RequireAuth />}>
                      <Route path="/profile/setup" element={<ProfileSetup />} />
                      <Route path="/banned" element={<BannedPage />} />

                      <Route element={<RequireApproved />}>
                        <Route element={<AppShell />}>
                          <Route index element={<HomeRoute />} />
                          <Route path="reserve" element={<Reserve />} />
                          <Route path="events" element={<EventsRoute />} />
                          <Route path="profile" element={<ProfileRoute />} />
                        </Route>

                        <Route element={<RequireAdmin />}>
                          <Route path="admin" element={<Admin />} />
                        </Route>

                        <Route element={<RequireBudgetManager />}>
                          <Route path="budget" element={<BudgetRoute />} />
                        </Route>
                      </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              </RealtimeProvider>
            </AuthProvider>
          </QueryClientProvider>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
      <Analytics />
    </AppErrorBoundary>
  );
}

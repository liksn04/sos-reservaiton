import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireApproved, RequireAdmin } from './components/RouteGuards';

import Login from './routes/Login';
import PendingApproval from './routes/PendingApproval';
import ProfileSetup from './routes/ProfileSetup';
import Home from './routes/Home';
import MyReservations from './routes/MyReservations';
import Profile from './routes/Profile';
import Admin from './routes/Admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
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

              {/* 승인 필요 */}
              <Route element={<RequireApproved />}>
                <Route path="/" element={<Home />} />
                <Route path="/my-reservations" element={<MyReservations />} />
                <Route path="/profile" element={<Profile />} />

                {/* 관리자 전용 */}
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>
            </Route>

            {/* 기타 경로 → 홈 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

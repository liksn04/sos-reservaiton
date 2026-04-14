import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** 로그인 필수. 미로그인 → /login */
export function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/**
 * 승인된 부원 전용.
 * - 프로필 미설정(display_name 비어있음) → /profile/setup
 * - pending/rejected → /pending-approval
 * - approved → 통과
 */
export function RequireApproved() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!session) return <Navigate to="/login" replace />;

  // 로컬 개발 환경 + 익명 로그인인 경우 승인 체크 우회
  const isLocalAnonymous = import.meta.env.DEV && (session?.user?.is_anonymous || session?.user?.app_metadata.provider === 'anonymous');
  if (isLocalAnonymous) return <Outlet />;

  if (!profile || profile.display_name === '')
    return <Navigate to="/profile/setup" replace />;
  if (profile.status === 'banned')
    return <Navigate to="/banned" replace />;
  return <Outlet />;
}

/** 관리자 전용 */
export function RequireAdmin() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile?.is_admin) return <Navigate to="/" replace />;
  return <Outlet />;
}

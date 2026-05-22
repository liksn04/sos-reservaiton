import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../contexts/useToast';
import { signInAnonymously, signInWithKakao } from '../services/authService';
import { resolveAuthenticatedRoute } from '../utils/authRedirect';

function KakaoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.58 2 11c0 2.79 1.783 5.245 4.48 6.65L5.14 21.9a.55.55 0 0 0 .76.61l4.74-2.35c.45.06.9.09 1.36.09 5.523 0 10-3.58 10-9s-4.477-9-10-9Z" />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export default function Login() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (loading || !session) return;

    const isLocalAnonymous =
      import.meta.env.DEV &&
      (session?.user?.is_anonymous || session?.user?.app_metadata.provider === 'anonymous');

    if (isLocalAnonymous) {
      navigate('/', { replace: true });
      return;
    }

    navigate(resolveAuthenticatedRoute(profile), { replace: true });
  }, [loading, navigate, profile, session]);

  async function handleKakaoLogin() {
    try {
      await signInWithKakao(`${window.location.origin}/`);
    } catch (error) {
      addToast('카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
      console.error(error);
    }
  }

  async function handleAnonymousLogin() {
    try {
      await signInAnonymously();
    } catch (error) {
      addToast('게스트 입장에 실패했습니다. Supabase Anonymous 로그인 설정을 확인해주세요.', 'error');
      console.error(error);
    }
  }

  return (
    <div className="roomin-login-page">
      <div className="roomin-login-backdrop" aria-hidden="true">
        <div className="roomin-login-surface-left" />
        <div className="roomin-login-surface-right" />
        <div className="roomin-login-texture" />
      </div>
      <main className="roomin-login-shell">
        <section className="roomin-login-hero" aria-labelledby="login-title">
          <div className="roomin-login-logo-shell" aria-hidden="true">
            <img
              src="/roomin-logo-blue.svg"
              alt=""
              className="roomin-login-logo-img roomin-login-logo-img-light"
            />
            <img
              src="/roomin-logo-purple.svg"
              alt=""
              className="roomin-login-logo-img roomin-login-logo-img-dark"
            />
          </div>

          <h1 id="login-title" className="roomin-login-title">Roomin</h1>
          <p className="roomin-login-tagline">당신의 공간, 더 가볍게</p>
        </section>

        <section className="roomin-login-actions" aria-label="로그인 옵션">
          <div className="roomin-login-button-stack">
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="roomin-login-kakao-button"
            >
              <KakaoIcon />
              <span>카카오로 계속하기</span>
            </button>

            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={handleAnonymousLogin}
                className="roomin-login-guest-button"
              >
                <GuestIcon />
                <span>게스트로 둘러보기</span>
              </button>
            )}
          </div>

          <p className="roomin-login-legal">
            로그인 시{' '}
            <Link to="/legal/terms" className="roomin-login-legal-link">
              이용약관
            </Link>
            {' '}및{' '}
            <Link to="/legal/privacy" className="roomin-login-legal-link">
              개인정보 처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

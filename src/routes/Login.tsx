import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { resolveAuthenticatedRoute } from '../utils/authRedirect';

export default function Login() {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  // 이미 로그인된 경우 적절한 경로로 리다이렉트
  useEffect(() => {
    if (loading || !session) return;

    // 로컬 개발 환경 + 익명 로그인인 경우 즉시 메인으로 이동
    const isLocalAnonymous = import.meta.env.DEV && (session?.user?.is_anonymous || session?.user?.app_metadata.provider === 'anonymous');
    if (isLocalAnonymous) {
      navigate('/', { replace: true });
      return;
    }

    navigate(resolveAuthenticatedRoute(profile), { replace: true });
  }, [loading, navigate, profile, session]);

  async function handleKakaoLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  }

  async function handleAnonymousLogin() {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      alert('익명 로그인에 실패했습니다. Supabase 설정에서 Anonymous 이네이블 되어 있는지 확인해주세요.');
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[38vh] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 mt-6 animate-fade-in-up">
        <div
          className="rounded-[2.25rem] p-8 text-white relative overflow-hidden"
          style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.9), transparent 40%)' }}
          />
          <div className="relative z-10">
            <div className="club-tag !bg-white/15 !text-white !mb-4">빛소리 예약 시스템</div>
            <h1 className="font-headline text-[2.6rem] font-bold leading-[1.05] tracking-tight">
              지금 연습할<br />
              시간을 잡아볼까요?
            </h1>
            <p className="mt-4 text-white/80 text-sm leading-6 font-medium">
              동아리방 예약과 일정 확인을 한 손으로 빠르게 처리할 수 있도록 라이트모드 경험을 정돈했습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3 my-8">
        <div className="surface-card p-5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">24시간 개방</h3>
              <p className="text-on-surface-variant text-xs font-semibold">영감이 떠오를 때 언제든 합주 시간을 확인하세요.</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-tertiary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[20px]">bolt</span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">간편한 예약</h3>
              <p className="text-on-surface-variant text-xs font-semibold">몇 번의 터치로 무대를 예약하세요.</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-fixed text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">체계적인 예약 관리</h3>
              <p className="text-on-surface-variant text-xs font-semibold">효율적으로 합주실 일정을 관리하세요.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3 z-10">
        <button
          onClick={handleKakaoLogin}
          className="w-full py-4 rounded-full bg-[#FEE500] text-[#191919] font-black flex items-center justify-center gap-3 hover:bg-[#FADA0A] transition-all text-[15px] shadow-[0_10px_24px_rgba(254,229,0,0.2)] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.077 4.05 6.577L5.1 21l4.65-2.325C10.2 18.9 11.1 19.05 12 19.05c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
          </svg>
          카카오 로그인
        </button>

        {import.meta.env.DEV && (
          <button
            onClick={handleAnonymousLogin}
            className="w-full py-3 mt-2 text-xs text-on-surface-variant underline hover:text-primary transition-colors font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            게스트로 계속하기 (개발용 패스)
          </button>
        )}
      </div>

      <div className="absolute bottom-6 w-full text-center">
        <p className="text-[9px] font-bold tracking-widest uppercase text-outline/60">
          로그인 시 <a href="#" className="underline text-on-surface-variant hover:text-on-surface">이용약관</a>에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}

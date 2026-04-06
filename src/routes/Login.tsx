import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  // 이미 로그인된 경우 적절한 경로로 리다이렉트
  useEffect(() => {
    if (!session) return;

    // 로컬 개발 환경 + 익명 로그인인 경우 즉시 메인으로 이동
    const isLocalAnonymous = import.meta.env.DEV && (session?.user?.is_anonymous || session?.user?.app_metadata.provider === 'anonymous');
    if (isLocalAnonymous) {
      navigate('/', { replace: true });
      return;
    }

    if (!profile || profile.display_name === '') {
      navigate('/profile/setup', { replace: true });
    } else if (profile.status === 'approved') {
      navigate('/', { replace: true });
    } else {
      navigate('/pending-approval', { replace: true });
    }
  }, [session, profile, navigate]);

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
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary-container/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm flex flex-col items-center z-10 mb-8 mt-4">
        
        <div className="text-center mb-6 z-10 animate-fade-in-up">
          <h1 className="text-7xl font-normal text-on-surface leading-[1.1] text-center" style={{ fontFamily: "'Great Vibes', cursive", textShadow: '0 0 40px rgba(168,85,247,0.5)' }}>
            Sound of<br />
            <span className="text-primary tracking-normal">Shine</span>
          </h1>
          <p className="text-on-surface-variant text-[10px] font-bold tracking-[0.25em] uppercase mt-3 py-1 px-3 border border-outline-variant/30 rounded-full inline-block">
            동방 예약 시스템 V1.0
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        <div className="glass-card rounded-[1.5rem] p-5 border border-outline-variant/10 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
            </div>
            <div>
              <h3 className="text-base font-black italic text-on-surface">24시간 개방</h3>
              <p className="text-on-surface-variant text-xs font-semibold">영감이 떠오를 때 언제든 연습하세요.</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[1.5rem] p-5 border border-outline-variant/10 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[20px]">bolt</span>
            </div>
            <div>
              <h3 className="text-base font-black italic text-on-surface">간편한 예약</h3>
              <p className="text-on-surface-variant text-xs font-semibold">몇 번의 터치로 무대를 예약하세요.</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-[1.5rem] p-5 border border-outline-variant/10 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary-fixed text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="text-base font-black italic text-on-surface">체계적인 예약 관리</h3>
              <p className="text-on-surface-variant text-xs font-semibold">효율적으로 합주실 일정을 관리하세요.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3 z-10">
        <button
          onClick={handleKakaoLogin}
          className="w-full py-4 rounded-full bg-[#FEE500] text-[#191919] font-black flex items-center justify-center gap-3 hover:bg-[#FADA0A] transition-all text-[15px] shadow-[0_8px_24px_rgba(254,229,0,0.15)] active:scale-[0.98]"
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
        <p className="text-[9px] font-bold tracking-widest uppercase text-outline/50">
          로그인 시 <a href="#" className="underline text-on-surface-variant hover:text-on-surface">이용약관</a>에 동의하는 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}

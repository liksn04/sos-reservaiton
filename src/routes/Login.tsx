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

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-logo">
          <i className="fa-solid fa-music" />
          <h1>빛소리 동아리방 <span>예약</span></h1>
        </div>
        <p className="login-desc">
          동아리 부원만 이용할 수 있습니다.<br />
          카카오 계정으로 로그인해주세요.
        </p>
        <button className="kakao-btn" onClick={handleKakaoLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.077 4.05 6.577L5.1 21l4.65-2.325C10.2 18.9 11.1 19.05 12 19.05c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
          </svg>
          카카오로 로그인
        </button>
      </div>
    </div>
  );
}

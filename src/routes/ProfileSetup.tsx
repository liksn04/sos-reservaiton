import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

export default function ProfileSetup() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-card glass-card" style={{ maxWidth: 480 }}>
        <div className="login-logo">
          <i className="fa-solid fa-user-pen" />
          <h1>프로필 설정</h1>
        </div>
        <p className="login-desc" style={{ marginBottom: '1.5rem' }}>
          동아리 내에서 사용할 프로필을 설정해주세요.
        </p>

        <ProfileForm
          mode="setup"
          onSuccess={() => navigate('/pending-approval', { replace: true })}
        />
      </div>
    </div>
  );
}

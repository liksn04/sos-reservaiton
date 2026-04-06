import { useAuth } from '../context/AuthContext';

export default function PendingApproval() {
  const { profile, signOut } = useAuth();

  const isRejected = profile?.status === 'rejected';

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-logo">
          <i className={`fa-solid ${isRejected ? 'fa-circle-xmark' : 'fa-clock'}`} />
          <h1>{isRejected ? '가입 거절' : '승인 대기 중'}</h1>
        </div>
        {isRejected ? (
          <p className="login-desc">
            죄송합니다. 가입 요청이 거절되었습니다.<br />
            문의사항은 동아리 관리자에게 연락해주세요.
          </p>
        ) : (
          <p className="login-desc">
            가입 요청이 접수되었습니다.<br />
            관리자 승인 후 서비스를 이용할 수 있습니다.
          </p>
        )}
        <button className="secondary-btn" onClick={signOut} style={{ marginTop: '1rem' }}>
          <i className="fa-solid fa-arrow-right-from-bracket" /> 로그아웃
        </button>
      </div>
    </div>
  );
}

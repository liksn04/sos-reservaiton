import { useAuth } from '../context/AuthContext';

export default function BannedPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 bg-error/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* 아이콘 */}
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-error/20">
          <span className="material-symbols-outlined text-[40px] text-error"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            block
          </span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-on-surface mb-2">
          접근이 <span className="text-error">차단</span>되었습니다
        </h1>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          {profile?.display_name ? (
            <><span className="text-on-surface font-bold">{profile.display_name}</span> 님의 계정이 관리자에 의해 차단되었습니다.</>
          ) : (
            '계정이 관리자에 의해 차단되었습니다.'
          )}
        </p>

        {/* 차단 사유 */}
        {profile?.banned_reason && (
          <div className="rounded-xl p-4 border border-error/20 bg-error/5 mb-6 text-left">
            <p className="text-xs font-black text-error mb-1 uppercase tracking-widest">차단 사유</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {profile.banned_reason}
            </p>
          </div>
        )}

        <p className="text-xs text-on-surface-variant mb-8 leading-relaxed">
          차단에 이의가 있는 경우 동아리 관리자에게 직접 문의하세요.
        </p>

        <button
          onClick={signOut}
          className="w-full secondary-btn flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          로그아웃
        </button>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { PART_INFO } from '../../lib/constants';
import type { Profile } from '../../types';

interface Props {
  profile: Profile | null;
  onEdit: () => void;
  onSignOut: () => void;
  onOpenDeleteDialog: () => void;
}

export function ProfileHeader({ profile, onEdit, onSignOut, onOpenDeleteDialog }: Props) {
  const parts = Array.isArray(profile?.part) ? profile?.part ?? [] : [];

  return (
    <section className="mb-10">
      <div
        className="surface-card flex flex-col items-center gap-4 relative overflow-hidden text-center"
        style={{ padding: '2.25rem 1.5rem' }}
      >
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center relative z-10 mx-auto"
          style={{ backgroundColor: 'var(--surface-container-high)', border: '2px solid rgba(var(--color-primary) / 0.08)' }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-[40px] text-muted">person</span>
          )}
        </div>
        <div className="flex flex-col items-center z-10 relative">
          <span className="text-[10px] font-bold tracking-[0.22em] text-primary mb-2 uppercase">멤버십 프로필</span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">{profile?.display_name || '게스트'}</h2>

          <div className="flex flex-wrap justify-center gap-1.5 mb-5">
            {parts.length > 0 ? (
              parts.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter"
                  style={{ backgroundColor: PART_INFO[p].bg, color: PART_INFO[p].text }}
                >
                  {PART_INFO[p].label}
                </span>
              ))
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[9px] font-black tracking-tighter">
                NO SESSION
              </span>
            )}
          </div>

          <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
            <button
              onClick={onEdit}
              className="secondary-btn !h-11 !min-w-[112px] !px-4 !text-xs"
            >
              프로필 편집
            </button>
            <button
              onClick={onSignOut}
              className="inline-flex min-w-[112px] items-center justify-center rounded-full border border-outline-border bg-surface-container-high px-4 py-2 text-xs font-bold text-error transition-colors"
            >
              로그아웃
            </button>
            {profile?.is_admin && (
              <Link
                to="/admin"
                className="inline-flex min-w-[112px] items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition-colors"
                style={{ backgroundColor: 'var(--club-tag-bg)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}
              >
                관리자
              </Link>
            )}
          </div>
          <button
            onClick={onOpenDeleteDialog}
            className="mt-4 text-xs text-on-surface-variant/40 hover:text-error/60 transition-colors underline underline-offset-2"
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </section>
  );
}

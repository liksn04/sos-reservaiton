import type { ReactNode } from 'react';
import type { Profile } from '../../types';

interface Props {
  user: Profile;
  badge?: ReactNode;
  meta?: ReactNode;
  actions: ReactNode;
}

export default function AdminUserCard({ user, badge, meta, actions }: Props) {
  return (
    <div className="glass-card rounded-[2rem] p-5 flex items-center gap-4 animate-fade-in-up">
      {/* 아바타 */}
      <div className="w-14 h-14 bg-surface-container-highest rounded-[1.25rem] overflow-hidden flex-shrink-0 border border-outline-variant/30 relative">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-40">
            <span className="material-symbols-outlined text-[28px]">person</span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="text-base font-bold text-on-surface truncate">
            {user.display_name || '(닉네임 미설정)'}
          </h4>
          {user.is_admin && (
            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black tracking-widest uppercase flex-shrink-0">
              ADMIN
            </span>
          )}
          {badge}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {user.part && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {user.part}
            </span>
          )}
          <span className="text-xs text-on-surface-variant truncate max-w-[160px]">
            {user.bio || '한줄소개 없음'}
          </span>
        </div>
        {meta}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 flex-shrink-0">
        {actions}
      </div>
    </div>
  );
}

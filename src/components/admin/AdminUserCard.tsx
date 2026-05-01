import type { ReactNode } from 'react';
import { MEMBER_ROLE_LABELS } from '../../utils/roles';
import type { Profile } from '../../types';

interface Props {
  user: Profile;
  badge?: ReactNode;
  meta?: ReactNode;
  actions: ReactNode;
}

export default function AdminUserCard({ user, badge, meta, actions }: Props) {
  return (
    <div className="surface-card p-6 flex items-center gap-5 animate-fade-in-up group hover:bg-surface-container-lowest transition-colors">
      {/* 아바타 */}
      <div className="w-16 h-16 bg-surface-container-highest rounded-full overflow-hidden flex-shrink-0 border border-card-border relative shadow-sm group-hover:scale-105 transition-transform">
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
          <h4 className="text-base font-black text-on-surface truncate leading-tight">
            {user.display_name || '(닉네임 미설정)'}
          </h4>
          {user.is_admin && (
            <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black tracking-widest uppercase flex-shrink-0">
              ADMIN
            </span>
          )}
          {user.member_role && user.member_role !== 'member' && (
            <span className="text-[9px] bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full font-black tracking-widest uppercase flex-shrink-0">
              {MEMBER_ROLE_LABELS[user.member_role]}
            </span>
          )}
          {badge}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {user.part && user.part.length > 0 && (
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {user.part.join(', ')}
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

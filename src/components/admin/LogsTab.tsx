import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import type { AdminActionLog } from '../../types';

const ACTION_META: Record<AdminActionLog['action'], { label: string; color: string; icon: string }> = {
  approve: { label: '승인',      color: 'text-primary',    icon: 'check_circle' },
  reject:  { label: '거절',      color: 'text-error',      icon: 'cancel' },
  ban:     { label: '차단',      color: 'text-error',      icon: 'block' },
  unban:   { label: '차단 해제', color: 'text-primary',    icon: 'lock_open' },
  promote: { label: '어드민 지정', color: 'text-secondary',  icon: 'shield' },
  demote:  { label: '어드민 해제', color: 'text-on-surface-variant', icon: 'shield_with_heart' },
  delete:  { label: '삭제',      color: 'text-error',      icon: 'delete_forever' },
};

export default function LogsTab() {
  const { data: logs = [], isLoading } = useQuery<AdminActionLog[]>({
    queryKey: queryKeys.admin.logs,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_action_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AdminActionLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold opacity-60">로그를 불러오는 중...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-surface-container-low border border-card-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 opacity-60">
        <span className="material-symbols-outlined text-5xl opacity-20">history</span>
        <p className="text-sm font-bold">관리 로그가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => {
        const meta = ACTION_META[log.action] ?? {
          label: log.action, color: 'text-on-surface-variant', icon: 'info',
        };
        const date = new Date(log.created_at);
        const dateStr = date.toLocaleDateString('ko-KR', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

        return (
          <div
            key={log.id}
            className="bg-surface-container-low border border-card-border rounded-2xl px-5 py-4 flex items-center gap-4 transition-colors hover:bg-surface-container-high"
          >
            {/* 아이콘 */}
            <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${meta.color}`}>
              {meta.icon}
            </span>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-black ${meta.color}`}>{meta.label}</span>
                <span className="text-xs text-on-surface font-bold truncate">
                  {log.target_name ?? '(삭제된 계정)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[11px] font-bold text-on-surface-variant/60">
                  by {log.admin_name ?? '알 수 없음'}
                </span>
                {log.reason && (
                  <span className="text-[11px] font-bold text-on-surface-variant/60 truncate">
                    · {log.reason}
                  </span>
                )}
              </div>
            </div>

            {/* 시간 */}
            <span className="text-[10px] font-bold text-on-surface-variant/40 flex-shrink-0">{dateStr}</span>
          </div>
        );
      })}
    </div>
  );
}

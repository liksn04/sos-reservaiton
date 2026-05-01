import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useDeleteReservation } from '../hooks/mutations/useDeleteReservation';
import { useLeaveReservation } from '../hooks/mutations/useLeaveReservation';
import {
  formatDate,
  getReservationEndTimestamp,
  getReservationStartTimestamp,
  normalizeTime,
} from '../utils/time';
import ProfileForm from '../components/ProfileForm';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import ThemeToggle from '../components/ThemeToggle';
import type { AppShellContext } from './AppShell';
import { PART_INFO } from '../lib/constants';
import { MEMBER_ROLE_LABELS, canManageReservations } from '../utils/roles';

export default function ProfileRoute() {
  const { profile, signOut } = useAuth();
  const { data: reservations = [] } = useReservations();
  const { openEdit } = useOutletContext<AppShellContext>();
  const deleteReservation = useDeleteReservation();
  const leaveReservation  = useLeaveReservation();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const canManage = canManageReservations(profile);

  async function handleDelete(id: string, teamName: string) {
    if (!confirm(`[${teamName}] 팀의 예약을 취소하시겠습니까?`)) return;
    try {
      await deleteReservation.mutateAsync(id);
    } catch {
      alert('예약 취소에 실패했습니다.');
    }
  }

  async function handleLeave(reservationId: string, teamName: string) {
    if (!profile) return;
    if (!confirm(`[${teamName}] 합주에서 빠지시겠습니까?`)) return;
    try {
      await leaveReservation.mutateAsync({ reservationId, userId: profile.id });
    } catch {
      alert('처리에 실패했습니다.');
    }
  }

  // ── 나의 예약 계산 ───────────────────────────────────
  const now = new Date();
  const nowTs = now.getTime();
  const today = formatDate(now);

  const allMyRes = reservations
    .filter((r) => {
      const isHost     = r.host_id === profile?.id;
      const isInvitee  = r.reservation_invitees?.some((inv) => inv.user_id === profile?.id);
      return isHost || isInvitee;
    })
    .map((r) => ({
      ...r,
      role: (r.host_id === profile?.id ? 'host' : 'invitee') as 'host' | 'invitee',
    }))
    .sort((a, b) => {
      const startDiff = getReservationStartTimestamp(a) - getReservationStartTimestamp(b);
      if (startDiff !== 0) return startDiff;
      return getReservationEndTimestamp(a) - getReservationEndTimestamp(b);
    });

  const myReservations = allMyRes.filter((r) => getReservationEndTimestamp(r) > nowTs);

  const myHistory = allMyRes
    .filter((r) => getReservationEndTimestamp(r) <= nowTs)
    .reverse();

  return (
    <div className="tab-content animate-slide-up">
      {isEditingProfile ? (
        <ProfileForm
          mode="edit"
          profile={profile}
          onSuccess={() => setIsEditingProfile(false)}
          onCancel={() => setIsEditingProfile(false)}
        />
      ) : (
        <>
          {/* ── 프로필 카드 ── */}
          <section className="mb-10">
            <div
              className="surface-card flex flex-col items-center gap-4 relative overflow-hidden text-center"
              style={{ padding: '2.25rem 1.5rem' }}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center relative z-10 mx-auto" style={{ backgroundColor: 'var(--surface-container-high)', border: '2px solid rgba(var(--color-primary) / 0.08)' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[40px] text-muted">person</span>
                )}
              </div>
              <div className="flex flex-col items-center z-10 relative">
                <span className="text-[10px] font-bold tracking-[0.22em] text-primary mb-2 uppercase">멤버십 프로필</span>
                <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">{profile?.display_name || '게스트'}</h2>
                
                {/* 파트 뱃지 영역 */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                  {(Array.isArray(profile?.part) ? profile!.part : []).map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter"
                      style={{ backgroundColor: PART_INFO[p].bg, color: PART_INFO[p].text }}
                    >
                      {PART_INFO[p].label}
                    </span>
                  ))}
                  {(!profile?.part || profile.part.length === 0) && (
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[9px] font-black tracking-tighter">
                      NO SESSION
                    </span>
                  )}
                  {profile?.member_role && profile.member_role !== 'member' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black tracking-tighter">
                      {MEMBER_ROLE_LABELS[profile.member_role]}
                    </span>
                  )}
                </div>

                <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="secondary-btn !h-11 !min-w-[112px] !px-4 !text-xs"
                  >
                    프로필 편집
                  </button>
                  <button
                    onClick={signOut}
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
                {/* 회원 탈퇴 링크 */}
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="mt-4 text-xs text-on-surface-variant/40 hover:text-error/60 transition-colors underline underline-offset-2"
                >
                  회원 탈퇴
                </button>
              </div>
            </div>
          </section>

          {/* ── 테마 설정 ── */}
          <section className="mb-8">
            <div className="surface-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">palette</span>
                <h4 className="font-headline text-sm font-bold text-on-surface tracking-tight">화면 테마</h4>
              </div>
              <ThemeToggle />
            </div>
          </section>

          {/* 회원 탈퇴 다이얼로그 */}
          <DeleteAccountDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
          />

          {/* ── 내 합주 일정 ── */}
          <section className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="font-headline text-3xl font-bold tracking-tight text-on-surface">내 합주 일정</h3>
              <p className="text-on-surface-variant text-sm mt-1">당신의 합주 일정을 확인해보세요</p>
            </div>
          </section>

          {/* 서브탭 */}
          <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'var(--outline-border)' }}>
            <button onClick={() => setScheduleTab('upcoming')} className="relative pb-3 px-1 group">
              <span
                className="font-headline text-lg font-bold transition-colors"
                style={{ color: scheduleTab === 'upcoming' ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                다가오는 일정
              </span>
              {scheduleTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg bg-primary-btn shadow-primary-glow"></div>
              )}
            </button>
            <button onClick={() => setScheduleTab('history')} className="relative pb-3 px-1 group">
              <span
                className="font-headline text-lg font-bold transition-colors"
                style={{ color: scheduleTab === 'history' ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                지난 일정
              </span>
              {scheduleTab === 'history' && (
                <div className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg bg-primary-btn shadow-primary-glow"></div>
              )}
            </button>
          </div>

          {/* 예약 카드 목록 */}
          <div className="space-y-4">
            {(scheduleTab === 'upcoming' ? myReservations : myHistory).length === 0 ? (
              <div className="glass-card rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">event_busy</span>
                <p className="text-on-surface-variant font-bold">
                  {scheduleTab === 'upcoming' ? '예정된 일정이 없습니다.' : '지난 일정이 없습니다.'}
                </p>
              </div>
            ) : (
              (scheduleTab === 'upcoming' ? myReservations : myHistory).map((res) => {
                const d = new Date(res.date + 'T00:00:00');
                const todayDate = new Date(today + 'T00:00:00');
                const diffDays =
                  scheduleTab === 'upcoming'
                    ? Math.ceil((d.getTime() - todayDate.getTime()) / (1000 * 3600 * 24))
                    : Math.floor((todayDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
                const isDday = scheduleTab === 'upcoming' && diffDays === 0;

                return (
                  <div
                    key={res.id}
                    className={`surface-card p-5 flex items-center gap-4 transition-all ${isDday ? 'border-primary/40 bg-primary/5 shadow-[0_4px_20px_rgba(0,100,255,0.08)]' : ''}`}
                  >
                    {/* D-Day 배지 */}
                    <div
                      className="flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-full border flex-shrink-0"
                      style={isDday
                        ? { backgroundColor: 'var(--club-tag-bg)', borderColor: 'var(--primary-border)' }
                        : { backgroundColor: 'var(--surface-container)', borderColor: 'var(--outline-border)' }
                      }
                    >
                      {isDday ? (
                        <div className="flex flex-col items-center">
                          <span className="font-black text-xl tracking-tighter text-primary leading-none">D-</span>
                          <span className="font-black text-sm tracking-tighter text-primary leading-none uppercase">Day</span>
                        </div>
                      ) : (
                        <span className="font-black text-2xl tracking-tighter text-on-surface-variant">
                          {scheduleTab === 'upcoming' ? `D-${diffDays}` : `D+${diffDays}`}
                        </span>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none">
                          {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${res.purpose === '합주' ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {res.purpose}
                        </span>
                      </div>
                      <p className="text-lg font-black text-on-surface tracking-tight leading-none mb-1.5 truncate">
                        {normalizeTime(res.start_time)} - {normalizeTime(res.end_time)}
                      </p>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                        <p className="font-headline font-bold text-base text-on-surface/80 truncate leading-none">{res.team_name}</p>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0 ml-auto pl-2">
                      {(res.role === 'host' || canManage) ? (
                        <>
                          <button
                            onClick={() => openEdit(res)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant border border-outline-variant/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                          </button>
                          <button
                            onClick={() => handleDelete(res.id, res.team_name)}
                            disabled={deleteReservation.isPending}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleLeave(res.id, res.team_name)}
                          disabled={leaveReservation.isPending}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

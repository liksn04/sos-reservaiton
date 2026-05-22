import { useCallback, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useDeleteReservation } from '../hooks/mutations/useDeleteReservation';
import { useLeaveReservation } from '../hooks/mutations/useLeaveReservation';
import { useMyReservations } from '../hooks/useMyReservations';
import { useConfirm } from '../contexts/useConfirm';
import { useToast } from '../contexts/useToast';
import { formatDate } from '../utils/time';
import ProfileForm from '../components/ProfileForm';
import DeleteAccountDialog from '../components/DeleteAccountDialog';
import ThemeToggle from '../components/ThemeToggle';
import PwaInstallPrompt from '../components/PwaInstallPrompt';
import ReservationNotificationPrompt from '../components/ReservationNotificationPrompt';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { MyReservationCard } from '../components/profile/MyReservationCard';
import type { AppShellContext } from './AppShell';
import type { MyReservation } from '../types';

type ScheduleTab = 'upcoming' | 'history';

export default function ProfileRoute() {
  const { profile, signOut } = useAuth();
  const { data: reservations = [] } = useReservations();
  const { openEdit } = useOutletContext<AppShellContext>();
  const deleteReservation = useDeleteReservation();
  const leaveReservation = useLeaveReservation();
  const confirm = useConfirm();
  const { addToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>('upcoming');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const today = formatDate(now);

  const { upcoming, history } = useMyReservations({
    reservations,
    userId: profile?.id,
    nowMs: now.getTime(),
  });

  const handleDelete = useCallback(async (id: string, teamName: string) => {
    const ok = await confirm({
      title: '예약 취소',
      description: `[${teamName}] 팀의 예약을 취소하시겠습니까?`,
      confirmLabel: '취소',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteReservation.mutateAsync(id);
    } catch {
      addToast('예약 취소에 실패했습니다.', 'error');
    }
  }, [deleteReservation, confirm, addToast]);

  const handleLeave = useCallback(async (reservationId: string, teamName: string) => {
    if (!profile) return;
    const ok = await confirm({
      title: '합주 참여 취소',
      description: `[${teamName}] 합주에서 빠지시겠습니까?`,
      confirmLabel: '빠지기',
      destructive: true,
    });
    if (!ok) return;
    try {
      await leaveReservation.mutateAsync({ reservationId, userId: profile.id });
    } catch {
      addToast('처리에 실패했습니다.', 'error');
    }
  }, [leaveReservation, profile, confirm, addToast]);

  const handleEditFromCard = useCallback((reservation: MyReservation) => {
    openEdit(reservation);
  }, [openEdit]);

  if (isEditingProfile) {
    return (
      <div className="tab-content animate-slide-up">
        <ProfileForm
          profile={profile}
          onSuccess={() => setIsEditingProfile(false)}
          onCancel={() => setIsEditingProfile(false)}
        />
      </div>
    );
  }

  const visibleReservations = scheduleTab === 'upcoming' ? upcoming : history;
  const isAdmin = profile?.is_admin ?? false;

  return (
    <div className="tab-content animate-slide-up">
      <ProfileHeader
        profile={profile}
        onEdit={() => setIsEditingProfile(true)}
        onSignOut={signOut}
        onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
      />

      <PwaInstallPrompt />
      <ReservationNotificationPrompt />

      <section className="mb-8">
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">palette</span>
            <h4 className="font-headline text-sm font-bold text-on-surface tracking-tight">화면 테마</h4>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-center gap-4 text-[11px] font-bold text-on-surface-variant/60">
          <Link to="/legal/terms" className="hover:text-on-surface transition-colors underline underline-offset-2">
            이용약관
          </Link>
          <span className="text-outline/30">|</span>
          <Link to="/legal/privacy" className="hover:text-on-surface transition-colors underline underline-offset-2">
            개인정보 처리방침
          </Link>
        </div>
      </section>

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />

      <section className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="font-headline text-3xl font-bold tracking-tight text-on-surface">내 합주 일정</h3>
          <p className="text-on-surface-variant text-sm mt-1">당신의 합주 일정을 확인해보세요</p>
        </div>
      </section>

      <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'var(--outline-border)' }}>
        {(['upcoming', 'history'] as ScheduleTab[]).map((tab) => (
          <button key={tab} onClick={() => setScheduleTab(tab)} className="relative pb-3 px-1 group">
            <span
              className="font-headline text-lg font-bold transition-colors"
              style={{ color: scheduleTab === tab ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              {tab === 'upcoming' ? '다가오는 일정' : '지난 일정'}
            </span>
            {scheduleTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg bg-primary-btn shadow-primary-glow"></div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleReservations.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">event_busy</span>
            <p className="text-on-surface-variant font-bold">
              {scheduleTab === 'upcoming' ? '예정된 일정이 없습니다.' : '지난 일정이 없습니다.'}
            </p>
          </div>
        ) : (
          visibleReservations.map((res) => (
            <MyReservationCard
              key={res.id}
              reservation={res}
              scheduleTab={scheduleTab}
              today={today}
              canManage={res.role === 'host' || isAdmin}
              isHostMutating={deleteReservation.isPending}
              isLeaveMutating={leaveReservation.isPending}
              onEdit={handleEditFromCard}
              onDelete={handleDelete}
              onLeave={handleLeave}
            />
          ))
        )}
      </div>
    </div>
  );
}

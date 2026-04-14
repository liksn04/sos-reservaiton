import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useAutoCleanup } from '../hooks/useAutoCleanup';
import { useReservationPolicySeasons } from '../hooks/useReservationPolicySeasons';
import BottomNav from '../components/BottomNav';
import ReservationModal from '../components/ReservationModal';
import type { ReservationWithDetails } from '../types';

/** Passed to child routes via <Outlet context={...}> */
export interface AppShellContext {
  openNew: (date?: Date) => void;
  openEdit: (res: ReservationWithDetails) => void;
}

export default function AppShell() {
  const { profile, loading: authLoading } = useAuth();
  const { data: reservations = [] } = useReservations();
  const {
    data: policySeasons = [],
    isLoading: isPolicySeasonsLoading,
  } = useReservationPolicySeasons();
  
  // 관리자 접속 시 14일 경과 데이터 청소
  useAutoCleanup();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationWithDetails | null>(null);
  const [modalDate, setModalDate] = useState<Date>(new Date());

  const openNew = (date?: Date) => {
    setEditingReservation(null);
    setModalDate(date || new Date());
    setModalOpen(true);
  };

  const openEdit = (res: ReservationWithDetails) => {
    setEditingReservation(res);
    setModalOpen(true);
  };

  const context = useMemo<AppShellContext>(() => ({ 
    openNew, 
    openEdit 
  }), []);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto relative" style={{ color: 'var(--text-main)' }}>

      {/* ── Top App Bar ── */}
      <header className="top-app-bar">
        <div className="logo-area">
          <div className="logo-icon">빛</div>
          <span className="logo-title">빛소리</span>
        </div>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/10">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              관리자
            </div>
          )}
          <div className="flex flex-col items-end justify-center min-w-0">
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] text-primary font-bold tracking-[0.18em] uppercase">ONLINE</span>
            </div>
            <span className="text-sm text-on-surface font-semibold leading-tight line-clamp-1">
              {profile?.display_name || '게스트'}
            </span>
          </div>
          <div
            className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
            style={{
              backgroundColor: 'rgb(var(--color-surface-container-lowest))',
              border: '2px solid rgba(var(--color-primary) / 0.08)',
              boxShadow: '0 10px 24px rgba(0, 78, 203, 0.08)',
            }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--text-muted)' }}>person</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Route content ── */}
      <main className="shell-main">
        <Outlet context={context} />
      </main>

      {/* ── Bottom Navigation ── */}
      <BottomNav />

      {/* 예약 모달 */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialDate={modalDate}
        editing={editingReservation}
        reservations={reservations}
        currentUserId={profile.id}
        policySeasons={policySeasons}
        isPolicySeasonsLoading={isPolicySeasonsLoading}
      />
    </div>
  );
}

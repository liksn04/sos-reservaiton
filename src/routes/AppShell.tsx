import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { useAutoCleanup } from '../hooks/useAutoCleanup';
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
    <div className="min-h-screen pb-24 max-w-2xl mx-auto relative" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}>

      {/* ── Top App Bar ── */}
      <header className="top-app-bar">
        <div className="logo-area"></div>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]">verified_user</span>
              ADMIN
            </div>
          )}
          <div className="flex flex-col items-end justify-center">
            <div className="flex items-center gap-1.5 leading-none mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] text-tertiary-container font-black tracking-widest uppercase">ONLINE</span>
            </div>
            <span className="text-sm text-on-surface font-bold leading-tight line-clamp-1">
              {profile?.display_name || '게스트'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--surface-highest)', border: '1px solid var(--outline-border)' }}>
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
      />
    </div>
  );
}

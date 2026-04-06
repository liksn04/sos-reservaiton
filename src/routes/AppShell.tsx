import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';
import { supabase } from '../lib/supabase';
import { normalizeTime } from '../utils/time';
import Calendar from '../components/Calendar';
import DailySchedule from '../components/DailySchedule';
import ReservationModal from '../components/ReservationModal';
import BottomNav from '../components/BottomNav';
import DashboardView from '../components/DashboardView';
import type { Tab } from '../components/BottomNav';
import type { ReservationWithDetails, Part } from '../types';

const PARTS: { value: Part; label: string }[] = [
  { value: 'vocal',    label: '보컬' },
  { value: 'guitar',   label: '기타' },
  { value: 'drum',     label: '드럼' },
  { value: 'bass',     label: '베이스' },
  { value: 'keyboard', label: '키보드' },
  { value: 'other',    label: '기타(other)' },
];

export default function AppShell() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: reservations = [] } = useReservations();
  const [totalUserCount, setTotalUserCount] = useState(0);

  // ── 탭 상태 ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // ── 홈 탭 상태 ────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationWithDetails | null>(null);

  // ── 프로필 탭 상태 ────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'upcoming'|'history'>('upcoming');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [part, setPart] = useState<Part>(profile?.part ?? 'guitar');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── 통계 데이터 (전체 사용자 수) ──────────────────
  useState(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalUserCount(count || 0));
  });

  // ── 모달 핸들러 ───────────────────────────────────────
  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(res: ReservationWithDetails) {
    setEditing(res);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleMonthChange(delta: 1 | -1) {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  }

  async function handleDelete(id: string, teamName: string) {
    if (!confirm(`[${teamName}] 팀의 예약을 취소하시겠습니까?`)) return;
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) {
      alert('예약 취소에 실패했습니다. 네트워크 연결을 확인해주세요.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  }

  async function handleLeave(reservationId: string, teamName: string) {
    if (!profile) return;
    if (!confirm(`[${teamName}] 합주에서 빠지시겠습니까?`)) return;
    const { error } = await supabase
      .from('reservation_invitees')
      .delete()
      .eq('reservation_id', reservationId)
      .eq('user_id', profile.id);
    if (error) {
      alert('처리에 실패했습니다.');
    } else {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  }

  // ── 프로필 저장 ───────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    if (!displayName.trim()) { setProfileError('닉네임을 입력해주세요.'); return; }
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${session.user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          part,
          bio: bio.trim() || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', session.user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setAvatarFile(null);
      setAvatarPreview(null);
      setProfileSuccess(true);
      setIsEditingProfile(false); // 저장 완료 후 모드 전환
    } catch (err) {
      setProfileError('저장에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }

  // ── 나의 예약 계산 ─────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const allMyRes = reservations
    .filter((r) => {
      const isHost = r.host_id === profile?.id;
      const isInvitee = r.reservation_invitees?.some((inv) => inv.user_id === profile?.id);
      return (isHost || isInvitee);
    })
    .map((r) => ({
      ...r,
      role: (r.host_id === profile?.id ? 'host' : 'invitee') as 'host' | 'invitee',
    }))
    .sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      if (dc !== 0) return dc;
      return normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time));
    });

  const myReservations = allMyRes.filter(r => r.date >= today);
  const myHistory = allMyRes.filter(r => r.date < today).reverse();

  const currentAvatar = avatarPreview ?? profile?.avatar_url ?? null;

  return (
    <div className="min-h-screen pb-24 text-on-surface bg-background max-w-2xl mx-auto relative">

      {/* ── TopAppBar ── */}
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
            <span className="text-sm text-on-surface font-bold leading-tight line-clamp-1">{profile?.display_name || '게스트'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/10 shadow-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-outline-variant text-[20px]">person</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 탭 콘텐츠 ────────────────────────────────── */}
      <main className="shell-main">

        {/* 홈 탭: 대시보드 */}
        {activeTab === 'home' && (
          <DashboardView 
            reservations={reservations}
            totalUserCount={totalUserCount}
            onViewSchedule={() => setActiveTab('reserve')}
          />
        )}

        {/* 예약 탭: 달력 및 상세 일정 */}
        {activeTab === 'reserve' && (
            <div className="animate-slide-up">
              <h2 className="dashboard-title text-center">
                합주실 예약
              </h2>

            <div style={{ background: 'var(--surface-container)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleMonthChange(-1)} className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>chevron_left</button>
                  <button onClick={() => handleMonthChange(1)} className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>chevron_right</button>
                </div>
              </div>

              <Calendar
                reservations={reservations}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  if (
                    date.getMonth() !== currentMonth.getMonth() ||
                    date.getFullYear() !== currentMonth.getFullYear()
                  ) {
                    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                }}
                onMonthChange={handleMonthChange}
              />
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>
                  선택된 날짜 <span style={{ color: 'var(--primary)' }}>{selectedDate.getMonth() + 1}/{selectedDate.getDate()}</span>
                </h3>
              </div>
              
              <DailySchedule
                reservations={reservations}
                selectedDate={selectedDate}
                currentUserId={profile?.id ?? ''}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>

            <button className="reserve-now-btn min-w-[200px] mx-auto mt-8 block" onClick={openNew}>
              <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>add_circle</span>
              예약 시간 추가하기
            </button>
          </div>
        )}

        {/* 프로필 및 스케줄 탭 */}
        {activeTab === 'profile' && (
          <div className="tab-content animate-slide-up">
            {!isEditingProfile ? (
              <>
                {/* Profile Section */}
                <section className="mb-10">
                  <div className="empty-card flex-col gap-4 border-none bg-surface-container relative overflow-hidden" style={{ borderRadius: '1.5rem', padding: '2rem 1.5rem' }}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-outline-variant/30 flex items-center justify-center bg-surface-container-highest relative z-10">
                      {currentAvatar ? (
                        <img src={currentAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[40px] text-outline-variant">person</span>
                      )}
                    </div>
                    <div className="flex flex-col items-center z-10 relative">
                      <span className="text-[10px] font-bold tracking-widest text-primary mb-1">멤버십 프로필</span>
                      <h2 className="text-xl font-bold text-white mb-4">{profile?.display_name || '게스트'}</h2>
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 rounded-lg bg-surface-container-highest text-xs font-bold text-white transition-colors border border-outline-variant/20">
                          프로필 편집
                        </button>
                        <button onClick={signOut} className="px-4 py-2 rounded-lg bg-surface-container-highest text-xs font-bold text-error/80 transition-colors border border-outline-variant/20">
                          로그아웃
                        </button>
                        {profile?.is_admin && (
                          <Link to="/admin" className="px-4 py-2 rounded-lg bg-surface-container-highest text-xs font-bold text-primary transition-colors border border-primary/30">
                            관리자
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-3xl font-black italic tracking-tight text-on-surface">내 합주 일정</h3>
                    <p className="text-on-surface-variant text-sm mt-1">당신의 합주 일정을 확인해보세요</p>
                  </div>
                </section>

                <div className="flex gap-4 mb-8 border-b border-outline-variant/20">
                  <button onClick={() => setScheduleTab('upcoming')} className="relative pb-3 px-1 group">
                    <span className={`text-lg font-black italic transition-colors ${scheduleTab === 'upcoming' ? 'text-purple-300' : 'text-on-surface-variant group-hover:text-on-surface'}`}>다가오는 일정</span>
                    {scheduleTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tertiary rounded-t-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>}
                  </button>
                  <button onClick={() => setScheduleTab('history')} className="relative pb-3 px-1 group">
                    <span className={`text-lg font-black italic transition-colors ${scheduleTab === 'history' ? 'text-purple-300' : 'text-on-surface-variant group-hover:text-on-surface'}`}>지난 일정</span>
                    {scheduleTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tertiary rounded-t-lg shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>}
                  </button>
                </div>

                {/* Booking Cards List */}
                <div className="space-y-4">
                  {(scheduleTab === 'upcoming' ? myReservations : myHistory).length === 0 ? (
                    <div className="glass-card rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border border-outline-variant/10">
                      <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">event_busy</span>
                      <p className="text-on-surface-variant font-bold">{scheduleTab === 'upcoming' ? '예정된 일정이 없습니다.' : '지난 일정이 없습니다.'}</p>
                    </div>
                  ) : (
                    (scheduleTab === 'upcoming' ? myReservations : myHistory).map((res) => {
                      const d = new Date(res.date + 'T00:00:00');
                      const diffDays = scheduleTab === 'upcoming' 
                        ? Math.ceil((d.getTime() - new Date(today).getTime()) / (1000 * 3600 * 24))
                        : Math.floor((new Date(today).getTime() - d.getTime()) / (1000 * 3600 * 24));
                      
                      const isDday = scheduleTab === 'upcoming' && diffDays === 0;
                      const badgeTextColor = isDday ? 'text-primary' : 'text-on-surface-variant';
                      
                      return (
                        <div key={res.id} className={`glass-card rounded-[1.5rem] p-5 flex items-center gap-4 border transition-all ${isDday ? 'border-primary/40 bg-primary/5 shadow-[0_4px_20px_rgba(204,151,255,0.1)]' : 'border-outline-variant/10'}`}>
                          
                          {/* Left: D-Day Space */}
                          <div className={`flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-full border flex-shrink-0 ${isDday ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/30'}`}>
                            {isDday ? (
                              <div className="flex flex-col items-center">
                                <span className="font-black text-xl italic tracking-tighter text-primary leading-none">D-</span>
                                <span className="font-black text-sm italic tracking-tighter text-primary leading-none uppercase">Day</span>
                              </div>
                            ) : (
                              <span className={`font-black text-2xl italic tracking-tighter ${badgeTextColor}`}>
                                {scheduleTab === 'upcoming' ? `D-${diffDays}` : `D+${diffDays}`}
                              </span>
                            )}
                          </div>

                          {/* Middle: Content */}
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
                              <p className="font-black italic text-base text-on-surface/80 truncate leading-none">{res.team_name}</p>
                            </div>
                          </div>
                          
                          {/* Right: Actions */}
                          <div className="flex flex-col gap-1.5 flex-shrink-0 ml-auto pl-2">
                            {res.role === 'host' ? (
                              <>
                                <button onClick={() => openEdit(res)} className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant border border-outline-variant/10">
                                  <span className="material-symbols-outlined text-[18px]">settings</span>
                                </button>
                                <button onClick={() => handleDelete(res.id, res.team_name)} className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleLeave(res.id, res.team_name)} className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-error-container/10 hover:text-error transition-colors text-on-surface-variant border border-outline-variant/10">
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
            ) : (
              <div className="glass-card p-6 rounded-xl relative overflow-hidden border border-outline-variant/10">
                {/* 프로필 수정 모드 */}
                <button 
                  onClick={() => setIsEditingProfile(false)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant z-20"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                
                <h2 className="text-2xl font-black italic text-on-surface mb-6 mt-2">프로필 수정</h2>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* 아바타 */}
                  <div className="flex justify-center">
                    <div 
                      className="w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant/50 cursor-pointer hover:border-primary transition-colors flex items-center justify-center bg-surface-container-highest relative group" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {currentAvatar ? (
                        <>
                          <img src={currentAvatar} alt="프로필" className="w-full h-full object-cover" />
                          <div className="absolute flex inset-0 bg-black/50 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white">photo_camera</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-on-surface-variant group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                          <span className="block text-[10px] font-bold tracking-widest mt-1 uppercase">Upload</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>닉네임 *</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>담당 파트</label>
                    <select 
                      value={part} 
                      onChange={(e) => setPart(e.target.value as Part)}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors appearance-none"
                    >
                      {PARTS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>한줄소개</label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={60}
                    />
                  </div>

                  {profileError && <p className="text-error text-sm font-bold">{profileError}</p>}
                  {profileSuccess && <p className="text-primary text-sm font-bold">성공적으로 저장되었습니다!</p>}

                  <button
                    type="submit"
                    className="primary-btn w-full mt-4 py-4"
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>


      {/* ── 바텀 네비게이션 ───────────────────────────── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ── 예약 모달 ─────────────────────────────────── */}
      <ReservationModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialDate={selectedDate}
        editing={editing}
        reservations={reservations}
        currentUserId={profile?.id ?? ''}
      />
    </div>
  );
}

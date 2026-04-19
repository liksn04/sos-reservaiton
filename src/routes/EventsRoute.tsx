import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useEventCategories } from '../hooks/useEventCategories';
import { useDeleteEvent } from '../hooks/mutations/useEventMutations';
import { useJoinEvent, useLeaveEvent } from '../hooks/mutations/useEventParticipantMutations';
import { useEventParticipantSummaries } from '../hooks/useEventParticipantSummaries';
import EventModal from '../components/EventModal';
import EventParticipantsModal from '../components/EventParticipantsModal';
import EventTimeline from '../components/EventTimeline';
import type { ClubEventWithDetails } from '../types';


type Tab = 'upcoming' | 'past' | 'timeline';

function formatKDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function diffDays(target: string, today: string) {
  const a = new Date(target + 'T00:00:00').getTime();
  const b = new Date(today + 'T00:00:00').getTime();
  return Math.round((a - b) / (1000 * 3600 * 24));
}

export default function EventsRoute() {
  const { profile } = useAuth();
  const { data: events = [], isLoading } = useEvents();
  const { data: categories = [] } = useEventCategories();
  const { data: participantSummaryMap = {}, isLoading: isSummaryLoading } = useEventParticipantSummaries(
    events.map((event) => event.id),
  );
  const deleteEvent = useDeleteEvent();

  const [tab, setTab] = useState<Tab>('upcoming');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClubEventWithDetails | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<ClubEventWithDetails | null>(null);


  const today = new Date().toISOString().slice(0, 10);
  const isAdmin = !!profile?.is_admin;

  const eventsWithSummaries = useMemo(() => (
    events.map((event) => ({
      ...event,
      participantSummary: participantSummaryMap[event.id] ?? {
        eventId: event.id,
        participantCount: 0,
        viewerJoined: false,
      },
    }))
  ), [events, participantSummaryMap]);

  const filtered = useMemo(() => {
    return eventsWithSummaries
      .filter((e) => (filterCategory ? e.category_id === filterCategory : true))
      .filter((e) => {
        const lastDay = e.end_date ?? e.start_date;
        if (tab === 'timeline') return true; // 타임라인은 전체 표시
        return tab === 'upcoming' ? lastDay >= today : lastDay < today;
      });
  }, [eventsWithSummaries, filterCategory, tab, today]);


  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dc = a.start_date.localeCompare(b.start_date);
      if (dc !== 0) return tab === 'upcoming' ? dc : -dc;
      return (a.start_time ?? '').localeCompare(b.start_time ?? '');
    });
    return arr;
  }, [filtered, tab]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(ev: ClubEventWithDetails) {
    setEditing(ev);
    setModalOpen(true);
  }
  async function handleDelete(ev: ClubEventWithDetails) {
    if (!confirm(`[${ev.title}] 일정을 삭제하시겠습니까?`)) return;
    try {
      await deleteEvent.mutateAsync(ev.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.');
    }
  }

  return (
    <div className="tab-content animate-slide-up">
      {/* 헤더 */}
      <section className="mb-8">
        <div className="club-tag">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          동아리 일정
        </div>
        <h2 className="dashboard-title">
          <span className="text-gradient-white-purple">우리의 큰</span><br />
          <span>일정 모아보기</span>
        </h2>
        <p className="dashboard-subtitle">
          정기공연, 버스킹, 워크샵 등<br />동아리의 주요 일정을 확인하세요.
        </p>
      </section>

      {/* 탭 */}
      <div className="flex gap-6 mb-6 border-b" style={{ borderColor: 'var(--outline-border)' }}>
        {(['upcoming', 'past', 'timeline'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative pb-3 px-1">
            <span
              className="font-headline text-lg font-bold transition-colors"
              style={{ color: tab === t ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              {t === 'upcoming' ? '다가오는 일정' : t === 'past' ? '지난 일정' : '타임라인'}
            </span>
            {tab === t && (
              <div className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg bg-primary-btn shadow-primary-glow" />
            )}
          </button>
        ))}
      </div>


      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 mb-6">
          <button
            onClick={() => setFilterCategory(null)}
            className={`soft-chip flex-shrink-0 ${filterCategory === null ? 'active' : ''}`}
            style={{
              borderColor: filterCategory === null ? 'var(--primary-border)' : 'transparent',
            }}
          >
            ALL
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                filterCategory === c.id
                  ? 'shadow-lg scale-105 text-white'
                  : 'bg-surface-container-high text-on-surface-variant border-transparent'
              }`}
              style={{
                backgroundColor: filterCategory === c.id ? c.color : '',
                color: filterCategory === c.id ? '#ffffff' : '',
                borderColor: filterCategory === c.id ? c.color : '',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* 일정 리스트 */}
      <div className="space-y-4 animate-fade-in">
        {isLoading ? (
          <div className="glass-card rounded-[2rem] p-10 flex justify-center">
            <div className="spinner" />
          </div>
        ) : isSummaryLoading ? (
          <div className="glass-card rounded-[2rem] p-10 flex justify-center">
            <div className="spinner" />
          </div>
        ) : tab === 'timeline' ? (
          <EventTimeline events={sorted} />
        ) : sorted.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">event_busy</span>
            <p className="text-on-surface-variant font-bold">
              {tab === 'upcoming' ? '예정된 일정이 없습니다.' : '지난 일정이 없습니다.'}
            </p>
          </div>
        ) : (
          sorted.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              today={today}
              tab={tab}
              isAdmin={isAdmin}
              onEdit={() => openEdit(ev)}
              onDelete={() => handleDelete(ev)}
              onViewParticipants={() => {
                setViewingParticipants(ev);
                setParticipantsModalOpen(true);
              }}
            />
          ))
        )}
      </div>
      
      {/* 일정 등록 버튼 (Admin 전용, Reserve 페이지 스타일) */}
      {isAdmin && (
        <button 
          className="reserve-now-btn min-w-[220px] mx-auto mt-10 block shadow-2xl hover:scale-105 transition-all" 
          onClick={openNew}
        >
          <span className="material-symbols-outlined" style={{ fontWeight: 'bold' }}>add_circle</span>
          일정 등록하기
        </button>
      )}



      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />

      <EventParticipantsModal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        event={viewingParticipants}
      />
    </div>
  );
}

/**
 * 개별 일정 카드 컴포넌트 (가독성을 위한 분리)
 */
function EventCard({ 
  ev, today, tab, isAdmin,
  onEdit, onDelete, onViewParticipants 
}: { 
  ev: ClubEventWithDetails, 
  today: string, 
  tab: Tab, 
  isAdmin: boolean,
  onEdit: () => void,
  onDelete: () => void,
  onViewParticipants: () => void
}) {
  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();

  const participantSummary = ev.participantSummary ?? {
    eventId: ev.id,
    participantCount: 0,
    viewerJoined: false,
  };
  const isJoined = participantSummary.viewerJoined;
  const dDays = diffDays(ev.start_date, today);
  const isDday = tab === 'upcoming' && dDays === 0;
  const cat = ev.category;

  const handleJoinToggle = async () => {
    try {
      if (isJoined) {
        if (confirm('참가를 취소하시겠습니까?')) {
          await leaveEvent.mutateAsync(ev.id);
        }
      } else {
        await joinEvent.mutateAsync(ev.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '요청 처리에 실패했습니다.');
    }
  };

  return (
    <div
      className="surface-card p-6 transition-all hover:translate-y-[-2px] group relative overflow-hidden"
      style={{
        borderColor: isDday ? (cat?.color ?? 'var(--primary)') : 'var(--card-border)',
        backgroundColor: isDday ? `${cat?.color ?? '#cc97ff'}15` : undefined,
        boxShadow: isDday ? `0 8px 30px ${cat?.color ?? '#cc97ff'}18` : undefined,
      }}
    >
      <div className="absolute top-4 right-5 text-[3rem] font-headline font-bold tracking-[-0.08em] select-none opacity-5" style={{ color: cat?.color ?? 'var(--primary)' }}>
        {tab === 'upcoming' ? `D-${Math.max(dDays, 0)}` : `D+${Math.abs(dDays)}`}
      </div>

      <div className="relative z-10">
        <div
          className="sm:hidden absolute top-0 right-0 flex items-center justify-center min-w-[78px] h-[40px] px-3 rounded-full border"
          style={{
            backgroundColor: cat ? `${cat.color}14` : 'var(--surface-container)',
            borderColor: cat?.color ?? 'var(--outline-border)',
            color: cat?.color ?? 'var(--primary)',
          }}
        >
          <span className="font-black text-base tracking-tighter">
            {tab === 'upcoming' ? `D-${Math.max(dDays, 0)}` : `D+${Math.abs(dDays)}`}
          </span>
        </div>

        <div className="flex items-start gap-4 pr-[92px] sm:pr-0">
          <div
            className="w-24 h-24 rounded-[1.75rem] flex-shrink-0 flex flex-col items-start justify-end p-4 text-white shadow-lg"
            style={{
              background: cat
                ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}CC 100%)`
                : 'var(--primary-btn-gradient)',
            }}
          >
            <span className="material-symbols-outlined text-[28px] mb-2">{cat?.icon ?? 'event'}</span>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase">{cat?.name ?? 'Event'}</span>
          </div>

          <div
            className="hidden sm:flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl border flex-shrink-0"
            style={{
              backgroundColor: cat ? `${cat.color}1A` : 'var(--surface-container)',
              borderColor: cat?.color ?? 'var(--outline-border)',
            }}
          >
            {isDday ? (
              <>
                <span className="font-black text-xl tracking-tighter leading-none" style={{ color: cat?.color ?? 'var(--primary)' }}>D-</span>
                <span className="font-black text-sm tracking-tighter leading-none uppercase" style={{ color: cat?.color ?? 'var(--primary)' }}>Day</span>
              </>
            ) : (
              <span className="font-black text-2xl tracking-tighter" style={{ color: cat?.color ?? 'var(--text-on-surface-var)' }}>
                {tab === 'upcoming' ? `D-${dDays}` : `D+${Math.abs(dDays)}`}
              </span>
            )}
          </div>

          {/* 본문 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {cat && (
                <span
                  className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest"
                  style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                >
                  <span className="material-symbols-outlined text-xs">{cat.icon}</span>
                  {cat.name}
                </span>
              )}
              {!ev.is_public && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-500">
                  비공개
                </span>
              )}
            </div>
            <h3 className="font-headline text-[1.4rem] font-bold tracking-tight text-on-surface mb-2 leading-tight">{ev.title}</h3>
            
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatKDate(ev.start_date)}
                {ev.start_time && ` ${ev.start_time.slice(0, 5)}`}
                {ev.end_date && ev.end_date !== ev.start_date && ` ~ ${formatKDate(ev.end_date)}`}
              </p>
              {ev.location && (
                <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">place</span>
                  {ev.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 참가자 정보 및 버튼 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer group min-w-0" onClick={onViewParticipants}>
            <div className="flex h-8 min-w-[44px] items-center justify-center rounded-full border border-card-border bg-surface-container px-3">
              <span className="material-symbols-outlined text-[15px] text-primary">group</span>
            </div>
            <span className="text-[10px] font-black text-muted group-hover:text-primary transition-colors whitespace-nowrap">
              {participantSummary.participantCount}명 참여 중
            </span>
          </div>

          {tab === 'upcoming' && (
            <button
              onClick={handleJoinToggle}
              disabled={joinEvent.isPending || leaveEvent.isPending}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm sm:ml-auto"
              style={{
                backgroundColor: isJoined ? `${cat?.color ?? '#cc97ff'}20` : 'var(--primary)',
                color: isJoined ? (cat?.color ?? 'var(--primary)') : 'var(--on-primary)',
                border: isJoined ? `1px solid ${cat?.color ?? '#cc97ff'}40` : 'none',
              }}
            >
              <span className="material-symbols-outlined text-sm">
                {isJoined ? 'check_circle' : 'add_circle'}
              </span>
              {isJoined ? '참여 완료' : '참여하기'}
            </button>
          )}
        </div>
        {/* 액션 (admin) */}
        {isAdmin && (
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={onEdit}
              title="수정"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container-high text-on-surface-variant border border-card-border hover:border-primary/50 hover:text-primary hover:bg-surface-highest group-hover:shadow-md"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
            <button
              onClick={onDelete}
              title="삭제"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-surface-container-high text-on-surface-variant border border-card-border hover:border-error/50 hover:text-error hover:bg-error/5 group-hover:shadow-md"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

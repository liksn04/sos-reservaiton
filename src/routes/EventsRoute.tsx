import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useEventCategories } from '../hooks/useEventCategories';
import { useDeleteEvent } from '../hooks/mutations/useEventMutations';
import { useJoinEvent, useLeaveEvent } from '../hooks/mutations/useEventParticipantMutations';
import { useEventParticipantSummaries } from '../hooks/useEventParticipantSummaries';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { useConfirm } from '../contexts/useConfirm';
import { useToast } from '../contexts/useToast';
import EventModal from '../components/EventModal';
import EventParticipantsModal from '../components/EventParticipantsModal';
import EventTimeline from '../components/EventTimeline';
import { EventCard } from '../components/events/EventCard';
import type { ClubEventWithDetails } from '../types';
import { formatDate } from '../utils/time';
import LoadingSpinner from '../components/LoadingSpinner';

type Tab = 'upcoming' | 'past' | 'timeline';

const TAB_LABELS: Record<Tab, string> = {
  upcoming: '다가오는 일정',
  past: '지난 일정',
  timeline: '타임라인',
};

export default function EventsRoute() {
  const { profile } = useAuth();
  const { data: events = [], isLoading } = useEvents();
  const { data: categories = [] } = useEventCategories();
  const { data: participantSummaryMap = {}, isLoading: isSummaryLoading } = useEventParticipantSummaries(
    events.map((event) => event.id),
  );
  const deleteEvent = useDeleteEvent();
  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const confirm = useConfirm();
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>('upcoming');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClubEventWithDetails | null>(null);
  const [viewingParticipants, setViewingParticipants] = useState<ClubEventWithDetails | null>(null);

  const today = formatDate(new Date());
  const isAdmin = !!profile?.is_admin;
  const isJoinPending = joinEvent.isPending || leaveEvent.isPending;

  const sorted = useFilteredEvents({
    events,
    participantSummaryMap,
    filterCategory,
    tab,
    today,
  });

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((event: ClubEventWithDetails) => {
    setEditing(event);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (event: ClubEventWithDetails) => {
    const ok = await confirm({
      title: '일정 삭제',
      description: `[${event.title}] 일정을 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteEvent.mutateAsync(event.id);
    } catch (e) {
      addToast(e instanceof Error ? e.message : '삭제에 실패했습니다.', 'error');
    }
  }, [deleteEvent, confirm, addToast]);

  const handleViewParticipants = useCallback((event: ClubEventWithDetails) => {
    setViewingParticipants(event);
    setParticipantsModalOpen(true);
  }, []);

  const handleJoinToggle = useCallback(async (event: ClubEventWithDetails) => {
    const isJoined = event.participantSummary?.viewerJoined ?? false;
    try {
      if (isJoined) {
        const ok = await confirm({
          title: '참가 취소',
          description: '참가를 취소하시겠습니까?',
          confirmLabel: '취소',
          destructive: true,
        });
        if (!ok) return;
        await leaveEvent.mutateAsync(event.id);
      } else {
        await joinEvent.mutateAsync(event.id);
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : '요청 처리에 실패했습니다.', 'error');
    }
  }, [joinEvent, leaveEvent, confirm, addToast]);

  return (
    <div className="tab-content animate-slide-up">
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

      <div className="segmented-control flex w-full overflow-x-auto no-scrollbar mb-6">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`segmented-option flex-1 whitespace-nowrap ${tab === t ? 'active' : ''}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 mb-6">
          <button
            onClick={() => setFilterCategory(null)}
            className={`soft-chip flex-shrink-0 ${filterCategory === null ? 'active' : ''}`}
            style={{ borderColor: filterCategory === null ? 'var(--primary-border)' : 'transparent' }}
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

      <div className="space-y-4 animate-fade-in">
        {isLoading || isSummaryLoading ? (
          <LoadingSpinner />
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
          sorted.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              today={today}
              tab={tab}
              isAdmin={isAdmin}
              isJoinPending={isJoinPending}
              onEdit={() => openEdit(event)}
              onDelete={() => handleDelete(event)}
              onViewParticipants={() => handleViewParticipants(event)}
              onJoinToggle={() => handleJoinToggle(event)}
            />
          ))
        )}
      </div>

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

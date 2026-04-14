-- ============================================================
-- 빛소리 동아리방 — Events Hub (Phase 2)
-- 일정 참가자(RSVP) 및 출석 관리
-- ============================================================

-- 참가자 기록 테이블
create table public.event_participants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.club_events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  attended    boolean not null default false,
  joined_at   timestamptz default now(),

  unique(event_id, user_id)
);

create index idx_event_participants_event on public.event_participants(event_id);
create index idx_event_participants_user on public.event_participants(user_id);

-- RLS
alter table public.event_participants enable row level security;

-- select: 본인 + 어드민
create policy "event_participants: can read own or admin"
  on public.event_participants for select
  using (
    user_id = (select auth.uid())
    or (select public.is_admin_user())
  );

-- insert: 본인만 참가
create policy "event_participants: can insert own"
  on public.event_participants for insert
  with check (user_id = (select auth.uid()));

-- delete: 본인 취소 + 어드민 삭제
create policy "event_participants: can delete own or admin"
  on public.event_participants for delete
  using (
    user_id = (select auth.uid())
    or (select public.is_admin_user())
  );

-- update(attended): 어드민만
create policy "event_participants: admin can mark attended"
  on public.event_participants for update
  using (select public.is_admin_user())
  with check (select public.is_admin_user());

-- Realtime
alter publication supabase_realtime add table public.event_participants;

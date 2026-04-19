-- ============================================================
-- 빛소리 동아리방 — Events Hub (Phase 1)
-- 동아리의 큰 일정(정기공연, 버스킹, 신입생 환영회 등) 관리
-- ============================================================

-- ── Event Categories ────────────────────────────────────────
create table public.event_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#cc97ff',  -- hex color for badge
  icon        text not null default 'event',     -- material symbols name
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);

-- 기본 카테고리 시드
insert into public.event_categories (name, color, icon, sort_order) values
  ('정기공연',  '#ec4899', 'theater_comedy',    10),
  ('버스킹',    '#f59e0b', 'music_note',        20),
  ('신입생환영', '#10b981', 'celebration',       30),
  ('MT',       '#3b82f6', 'forest',            40),
  ('워크샵',    '#a855f7', 'school',            50),
  ('기타',      '#6b7280', 'event',             99);

-- ── Club Events ─────────────────────────────────────────────
create table public.club_events (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references public.event_categories(id) on delete set null,
  title           text not null,
  description     text,
  location        text,
  -- 일정 (날짜만 있어도 되고, 시간/종료일 모두 선택)
  start_date      date not null,
  start_time      time,
  end_date        date,
  end_time        time,
  -- 메타
  cover_image_url text,
  is_public       boolean not null default true,  -- false면 임시저장 (admin only)
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_club_events_start_date on public.club_events(start_date);
create index idx_club_events_category on public.club_events(category_id);

-- updated_at 자동 갱신
create or replace function public.touch_club_events_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_club_events_updated_at
  before update on public.club_events
  for each row execute function public.touch_club_events_updated_at();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.event_categories enable row level security;
alter table public.club_events       enable row level security;

-- event_categories
create policy "event_categories_select"
  on public.event_categories for select
  using (
    (select public.is_approved()) or (select public.is_admin_user())
  );

create policy "event_categories_insert"
  on public.event_categories for insert
  with check (select public.is_admin_user());

create policy "event_categories_update"
  on public.event_categories for update
  using (select public.is_admin_user())
  with check (select public.is_admin_user());

create policy "event_categories_delete"
  on public.event_categories for delete
  using (select public.is_admin_user());

-- club_events
create policy "club_events: approved can read public"
  on public.club_events for select
  using (
    (select public.is_approved())
    and (is_public = true or created_by = (select auth.uid())
         or (select public.is_admin_user()))
  );

create policy "club_events: admin can insert"
  on public.club_events for insert
  with check (select public.is_admin_user());

create policy "club_events: admin can update"
  on public.club_events for update
  using (select public.is_admin_user())
  with check (select public.is_admin_user());

create policy "club_events: admin can delete"
  on public.club_events for delete
  using (select public.is_admin_user());

-- ── Realtime ────────────────────────────────────────────────
alter publication supabase_realtime add table public.club_events;
alter publication supabase_realtime add table public.event_categories;

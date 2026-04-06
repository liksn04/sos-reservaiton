-- ============================================================
-- 빛소리 동아리방 예약 시스템 — DB 스키마 + RLS
-- Supabase SQL Editor 또는 CLI로 실행하세요.
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  kakao_id      text,
  display_name  text not null default '',
  avatar_url    text,
  part          text check (part in ('vocal', 'guitar', 'drum', 'bass', 'keyboard', 'other')),
  bio           text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  is_admin      boolean not null default false,
  created_at    timestamptz default now()
);

-- 카카오 로그인 직후 자동으로 profiles 행 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, kakao_id)
  values (
    new.id,
    new.raw_user_meta_data->>'provider_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Reservations ────────────────────────────────────────────
create table public.reservations (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references public.profiles(id) on delete cascade,
  date         date not null,
  start_time   time not null,
  end_time     time not null,
  is_next_day  boolean not null default false,
  team_name    text not null,
  people_count int not null,
  purpose      text not null check (purpose in ('합주', '강습', '정기회의')),
  created_at   timestamptz default now()
);

-- ── Reservation Invitees ─────────────────────────────────────
create table public.reservation_invitees (
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  primary key (reservation_id, user_id)
);

-- ── RLS 활성화 ───────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.reservations       enable row level security;
alter table public.reservation_invitees enable row level security;

-- ── 헬퍼 함수 ────────────────────────────────────────────────
create or replace function public.is_approved()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_admin_user()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true and status = 'approved'
  );
$$;

-- ── profiles RLS 정책 ─────────────────────────────────────────
-- 자기 자신은 항상 조회 가능
create policy "profiles_select_self"
  on public.profiles for select
  using (id = auth.uid());

-- approved 유저는 다른 approved 유저 프로필 조회 가능 (초대 목록용)
create policy "profiles_select_approved_others"
  on public.profiles for select
  using (public.is_approved() and status = 'approved');

-- 회원가입 시 자동 insert (트리거가 security definer로 처리하므로 정책 불필요)
-- 자기 프로필만 수정 가능 (display_name, avatar_url, part, bio)
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- 관리자는 status/is_admin 포함 모든 프로필 수정 가능
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin_user());

-- 관리자는 pending 포함 모든 프로필 조회 가능
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin_user());

-- ── reservations RLS 정책 ────────────────────────────────────
create policy "reservations_select_approved"
  on public.reservations for select
  using (public.is_approved());

create policy "reservations_insert_approved"
  on public.reservations for insert
  with check (public.is_approved() and host_id = auth.uid());

create policy "reservations_update_host"
  on public.reservations for update
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "reservations_delete_host"
  on public.reservations for delete
  using (host_id = auth.uid());

-- ── reservation_invitees RLS 정책 ────────────────────────────
create policy "invitees_select_approved"
  on public.reservation_invitees for select
  using (public.is_approved());

-- 예약의 호스트만 초대 추가 가능
create policy "invitees_insert_host"
  on public.reservation_invitees for insert
  with check (
    public.is_approved() and
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.host_id = auth.uid()
    )
  );

-- 호스트 또는 초대받은 본인이 삭제 가능 (빠지기 지원)
create policy "invitees_delete_host_or_self"
  on public.reservation_invitees for delete
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.host_id = auth.uid()
    )
  );

-- ── Storage 버킷 ──────────────────────────────────────────────
-- Supabase 대시보드 Storage → New Bucket에서 수동으로 생성하세요:
-- Bucket name: avatars
-- Public bucket: true (공개 읽기)
-- 아래 Storage RLS 정책도 Supabase 대시보드에서 추가하세요:
--   INSERT: auth.uid() is not null
--   UPDATE: auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: auth.uid()::text = (storage.foldername(name))[1]

-- ============================================================
-- 첫 관리자 지정 (본인 가입 후 SQL Editor에서 실행):
-- update public.profiles
--   set is_admin = true, status = 'approved'
--   where id = '<your-user-uuid>';
-- ============================================================

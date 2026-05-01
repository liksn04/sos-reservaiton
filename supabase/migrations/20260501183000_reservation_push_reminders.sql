-- ============================================================
-- 예약 PWA 푸시 리마인더
-- ============================================================

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_owner" on public.push_subscriptions;
create policy "push_subscriptions_select_owner"
  on public.push_subscriptions for select
  using (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_insert_owner" on public.push_subscriptions;
create policy "push_subscriptions_insert_owner"
  on public.push_subscriptions for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_update_owner" on public.push_subscriptions;
create policy "push_subscriptions_update_owner"
  on public.push_subscriptions for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "push_subscriptions_delete_owner" on public.push_subscriptions;
create policy "push_subscriptions_delete_owner"
  on public.push_subscriptions for delete
  using (user_id = (select auth.uid()));

create or replace function public.touch_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.last_seen_at := now();
  return new;
end;
$$;

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.touch_push_subscriptions_updated_at();

create table if not exists public.reservation_reminder_deliveries (
  id                   uuid primary key default gen_random_uuid(),
  reservation_id       uuid not null references public.reservations(id) on delete cascade,
  user_id              uuid not null references public.profiles(id) on delete cascade,
  reminder_type        text not null check (reminder_type in ('two_hours', 'thirty_minutes')),
  reservation_start_at timestamptz not null,
  status               text not null default 'pending'
                         check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts             int not null default 0,
  last_error           text,
  sent_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (reservation_id, user_id, reminder_type, reservation_start_at)
);

create index if not exists idx_reservation_reminder_deliveries_reservation
  on public.reservation_reminder_deliveries (reservation_id, reservation_start_at);

create index if not exists idx_reservation_reminder_deliveries_user
  on public.reservation_reminder_deliveries (user_id, created_at desc);

alter table public.reservation_reminder_deliveries enable row level security;

create or replace function public.touch_reservation_reminder_deliveries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_reservation_reminder_deliveries_updated_at on public.reservation_reminder_deliveries;
create trigger trg_reservation_reminder_deliveries_updated_at
before update on public.reservation_reminder_deliveries
for each row execute function public.touch_reservation_reminder_deliveries_updated_at();

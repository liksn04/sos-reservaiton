-- ============================================================
-- 합주 당일 예약 허용 시즌
-- ============================================================

create table if not exists public.reservation_policy_seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  note        text,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reservation_policy_seasons_name_length_check
    check (char_length(btrim(name)) between 1 and 60),
  constraint reservation_policy_seasons_date_range_check
    check (start_date <= end_date),
  constraint reservation_policy_seasons_note_length_check
    check (note is null or char_length(note) <= 200)
);

create index if not exists idx_reservation_policy_seasons_active_range
  on public.reservation_policy_seasons (is_active, start_date, end_date);

alter table public.reservation_policy_seasons enable row level security;

create or replace function public.set_reservation_policy_season_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.name := btrim(new.name);
  new.note := nullif(btrim(coalesce(new.note, '')), '');
  new.updated_at := now();

  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.validate_reservation_policy_season_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.is_active then
    return new;
  end if;

  if exists (
    select 1
    from public.reservation_policy_seasons season
    where season.id <> new.id
      and season.is_active = true
      and daterange(season.start_date, season.end_date, '[]')
        && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception '활성화된 당일 예약 허용 시즌은 서로 겹칠 수 없습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_reservation_policy_season_defaults
  on public.reservation_policy_seasons;

create trigger trg_set_reservation_policy_season_defaults
before insert or update on public.reservation_policy_seasons
for each row
execute function public.set_reservation_policy_season_defaults();

drop trigger if exists trg_validate_reservation_policy_season_overlap
  on public.reservation_policy_seasons;

create trigger trg_validate_reservation_policy_season_overlap
before insert or update on public.reservation_policy_seasons
for each row
execute function public.validate_reservation_policy_season_overlap();

create or replace function public.is_same_day_hanju_booking_season(target_date date)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.reservation_policy_seasons season
    where season.is_active = true
      and target_date between season.start_date and season.end_date
  );
$$;

create or replace function public.validate_same_day_hanju_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_today date := timezone('Asia/Seoul', now())::date;
begin
  if new.purpose <> '합주' then
    return new;
  end if;

  if new.date <> local_today then
    return new;
  end if;

  -- Edge case: 시즌 중 이미 생성된 당일 예약은 동일 날짜 수정만 허용합니다.
  if tg_op = 'UPDATE'
     and old.purpose = '합주'
     and old.date = local_today then
    return new;
  end if;

  if not public.is_same_day_hanju_booking_season(local_today) then
    raise exception '합주는 당일 예약이 불가합니다. 최소 하루 전에 예약해주세요.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_same_day_hanju_reservation
  on public.reservations;

create trigger trg_validate_same_day_hanju_reservation
before insert or update on public.reservations
for each row
execute function public.validate_same_day_hanju_reservation();

create policy "reservation_policy_seasons_select_approved"
  on public.reservation_policy_seasons for select
  using ((select public.is_approved()));

create policy "reservation_policy_seasons_insert_admin"
  on public.reservation_policy_seasons for insert
  with check ((select public.is_admin_user()));

create policy "reservation_policy_seasons_update_admin"
  on public.reservation_policy_seasons for update
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

create policy "reservation_policy_seasons_delete_admin"
  on public.reservation_policy_seasons for delete
  using ((select public.is_admin_user()));

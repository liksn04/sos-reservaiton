create schema if not exists private;

-- ============================================================
-- Event participant summaries (public aggregate surface)
-- ============================================================
create table if not exists public.event_participant_counts (
  event_id           uuid primary key references public.club_events(id) on delete cascade,
  participant_count  integer not null default 0 check (participant_count >= 0),
  updated_at         timestamptz not null default now()
);

alter table public.event_participant_counts enable row level security;

drop policy if exists "event_participant_counts_select" on public.event_participant_counts;

create policy "event_participant_counts_select"
  on public.event_participant_counts
  for select
  using (
    (
      (select public.is_approved())
      or (select public.is_admin_user())
    )
    and exists (
      select 1
      from public.club_events as event
      where event.id = event_participant_counts.event_id
        and (
          event.is_public = true
          or event.created_by = (select auth.uid())
          or (select public.is_admin_user())
        )
    )
  );

create or replace function private.refresh_event_participant_count(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if target_event_id is null then
    return;
  end if;

  insert into public.event_participant_counts as counts (
    event_id,
    participant_count,
    updated_at
  )
  select
    target_event_id,
    count(*)::integer,
    now()
  from public.event_participants
  where event_id = target_event_id
  on conflict (event_id) do update
  set
    participant_count = excluded.participant_count,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function private.handle_event_participant_count_change()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_event_participant_count(old.event_id);
    return old;
  end if;

  perform private.refresh_event_participant_count(new.event_id);

  if tg_op = 'UPDATE' and old.event_id is distinct from new.event_id then
    perform private.refresh_event_participant_count(old.event_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_event_participant_count_change on public.event_participants;

create trigger trg_event_participant_count_change
  after insert or update or delete on public.event_participants
  for each row
  execute function private.handle_event_participant_count_change();

insert into public.event_participant_counts (event_id, participant_count, updated_at)
select
  event_id,
  count(*)::integer,
  now()
from public.event_participants
group by event_id
on conflict (event_id) do update
set
  participant_count = excluded.participant_count,
  updated_at = excluded.updated_at;

-- ============================================================
-- Reservation cleanup ownership moves to the database
-- ============================================================
create table if not exists private.maintenance_runs (
  id             bigint generated always as identity primary key,
  job_name       text not null,
  ran_at         timestamptz not null default now(),
  deleted_count  integer,
  error_message  text
);

create index if not exists idx_maintenance_runs_job_name_ran_at
  on private.maintenance_runs(job_name, ran_at desc);

create or replace function private.cleanup_expired_reservations(days integer default 14)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  normalized_days integer := coalesce(days, 14);
  deleted_total integer := 0;
begin
  if normalized_days < 1 or normalized_days > 365 then
    raise exception 'cleanup_expired_reservations: invalid days value %', normalized_days;
  end if;

  with deleted_rows as (
    delete from public.reservations
    where date < (current_date - normalized_days)
    returning 1
  )
  select count(*)
  into deleted_total
  from deleted_rows;

  insert into private.maintenance_runs (
    job_name,
    deleted_count,
    error_message
  ) values (
    'cleanup_expired_reservations',
    deleted_total,
    null
  );

  return deleted_total;
exception
  when others then
    insert into private.maintenance_runs (
      job_name,
      deleted_count,
      error_message
    ) values (
      'cleanup_expired_reservations',
      null,
      left(sqlerrm, 1000)
    );
    raise;
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-expired-reservations',
  '15 3 * * *',
  $$select private.cleanup_expired_reservations(14);$$
);

-- 운영 점검용 예시:
-- select status, count(*)
-- from public.profiles
-- where status not in ('approved', 'banned')
-- group by status;

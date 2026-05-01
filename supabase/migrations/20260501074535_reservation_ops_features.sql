-- ============================================================
-- 예약 운영 기능 — 역할 분리 + 예약 변경 이력
-- ============================================================

-- 1. 운영 역할
alter table public.profiles
  add column if not exists member_role text not null default 'member';

alter table public.profiles
  drop constraint if exists profiles_member_role_check;

alter table public.profiles
  add constraint profiles_member_role_check
    check (member_role in ('member', 'operations', 'treasurer', 'president'));

update public.profiles
set member_role = 'president'
where is_admin = true
  and member_role = 'member';

create or replace function public.has_member_role(allowed_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and status = 'approved'
      and (
        is_admin = true
        or member_role = any(allowed_roles)
      )
  );
$$;

create or replace function public.can_manage_reservations()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_member_role(array['operations', 'president']);
$$;

create or replace function public.can_manage_budget()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_member_role(array['treasurer', 'president']);
$$;

-- 2. 예약 변경 이력
create table if not exists public.reservation_change_log (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete set null,
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_name     text,
  action         text not null
                   check (action in ('reservation_updated', 'reservation_deleted', 'invitee_added', 'invitee_removed')),
  previous_data  jsonb,
  next_data      jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_reservation_change_log_reservation_created
  on public.reservation_change_log (reservation_id, created_at desc);

create index if not exists idx_reservation_change_log_actor_created
  on public.reservation_change_log (actor_id, created_at desc);

alter table public.reservation_change_log enable row level security;

create or replace function public.current_profile_name()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select display_name
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function public.log_reservation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.date,
    old.start_time,
    old.end_time,
    old.is_next_day,
    old.team_name,
    old.people_count,
    old.purpose
  ) is distinct from (
    new.date,
    new.start_time,
    new.end_time,
    new.is_next_day,
    new.team_name,
    new.people_count,
    new.purpose
  ) then
    insert into public.reservation_change_log (
      reservation_id,
      actor_id,
      actor_name,
      action,
      previous_data,
      next_data
    )
    values (
      new.id,
      auth.uid(),
      public.current_profile_name(),
      'reservation_updated',
      jsonb_build_object(
        'date', old.date,
        'start_time', old.start_time,
        'end_time', old.end_time,
        'is_next_day', old.is_next_day,
        'team_name', old.team_name,
        'people_count', old.people_count,
        'purpose', old.purpose
      ),
      jsonb_build_object(
        'date', new.date,
        'start_time', new.start_time,
        'end_time', new.end_time,
        'is_next_day', new.is_next_day,
        'team_name', new.team_name,
        'people_count', new.people_count,
        'purpose', new.purpose
      )
    );
  end if;

  return new;
end;
$$;

create or replace function public.log_reservation_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.reservation_change_log (
    reservation_id,
    actor_id,
    actor_name,
    action,
    previous_data
  )
  values (
    old.id,
    auth.uid(),
    public.current_profile_name(),
    'reservation_deleted',
    jsonb_build_object(
      'date', old.date,
      'start_time', old.start_time,
      'end_time', old.end_time,
      'is_next_day', old.is_next_day,
      'team_name', old.team_name,
      'people_count', old.people_count,
      'purpose', old.purpose
    )
  );

  return old;
end;
$$;

create or replace function public.log_reservation_invitee_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_reservation_id uuid;
  target_user_id uuid;
  target_user_name text;
begin
  target_reservation_id := case when tg_op = 'DELETE' then old.reservation_id else new.reservation_id end;
  target_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;

  select display_name
    into target_user_name
  from public.profiles
  where id = target_user_id;

  insert into public.reservation_change_log (
    reservation_id,
    actor_id,
    actor_name,
    action,
    previous_data,
    next_data
  )
  values (
    target_reservation_id,
    auth.uid(),
    public.current_profile_name(),
    case when tg_op = 'DELETE' then 'invitee_removed' else 'invitee_added' end,
    case when tg_op = 'DELETE'
      then jsonb_build_object('user_id', target_user_id, 'display_name', target_user_name)
      else null
    end,
    case when tg_op = 'INSERT'
      then jsonb_build_object('user_id', target_user_id, 'display_name', target_user_name)
      else null
    end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_log_reservation_update on public.reservations;
create trigger trg_log_reservation_update
after update on public.reservations
for each row
execute function public.log_reservation_update();

drop trigger if exists trg_log_reservation_delete on public.reservations;
create trigger trg_log_reservation_delete
before delete on public.reservations
for each row
execute function public.log_reservation_delete();

drop trigger if exists trg_log_reservation_invitee_insert on public.reservation_invitees;
create trigger trg_log_reservation_invitee_insert
after insert on public.reservation_invitees
for each row
execute function public.log_reservation_invitee_change();

drop trigger if exists trg_log_reservation_invitee_delete on public.reservation_invitees;
create trigger trg_log_reservation_invitee_delete
after delete on public.reservation_invitees
for each row
execute function public.log_reservation_invitee_change();

drop policy if exists "reservation_change_log_select_relevant" on public.reservation_change_log;
create policy "reservation_change_log_select_relevant"
  on public.reservation_change_log for select
  using (
    (select public.can_manage_reservations())
    or actor_id = (select auth.uid())
    or exists (
      select 1
      from public.reservations r
      where r.id = reservation_id
        and (
          r.host_id = (select auth.uid())
          or exists (
            select 1
            from public.reservation_invitees ri
            where ri.reservation_id = r.id
              and ri.user_id = (select auth.uid())
          )
        )
    )
  );

-- 3. 예약 운영진도 예약/초대 관리 가능
drop policy if exists "reservations_update_host" on public.reservations;
create policy "reservations_update_host"
  on public.reservations for update
  using (host_id = (select auth.uid()) or (select public.can_manage_reservations()))
  with check (host_id = (select auth.uid()) or (select public.can_manage_reservations()));

drop policy if exists "reservations_delete_host" on public.reservations;
create policy "reservations_delete_host"
  on public.reservations for delete
  using (host_id = (select auth.uid()) or (select public.can_manage_reservations()));

drop policy if exists "invitees_insert_host" on public.reservation_invitees;
create policy "invitees_insert_host"
  on public.reservation_invitees for insert
  with check (
    (select public.is_approved()) and
    (
      (select public.can_manage_reservations())
      or exists (
        select 1 from public.reservations r
        where r.id = reservation_id and r.host_id = (select auth.uid())
      )
    )
  );

drop policy if exists "invitees_delete_host_or_self" on public.reservation_invitees;
create policy "invitees_delete_host_or_self"
  on public.reservation_invitees for delete
  using (
    user_id = (select auth.uid())
    or (select public.can_manage_reservations())
    or exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.host_id = (select auth.uid())
    )
  );

-- 4. 총무/회장도 예산 관리 가능
drop policy if exists "budget_categories_insert" on public.budget_categories;
create policy "budget_categories_insert"
  on public.budget_categories for insert
  with check ((select public.can_manage_budget()));

drop policy if exists "budget_categories_update" on public.budget_categories;
create policy "budget_categories_update"
  on public.budget_categories for update
  using ((select public.can_manage_budget()))
  with check ((select public.can_manage_budget()));

drop policy if exists "budget_categories_delete" on public.budget_categories;
create policy "budget_categories_delete"
  on public.budget_categories for delete
  using ((select public.can_manage_budget()));

drop policy if exists "budget_transactions: admin only" on public.budget_transactions;
create policy "budget_transactions: budget managers only"
  on public.budget_transactions for all
  using ((select public.can_manage_budget()))
  with check ((select public.can_manage_budget()));

drop policy if exists "membership_fee_policies: admin only" on public.membership_fee_policies;
create policy "membership_fee_policies: budget managers only"
  on public.membership_fee_policies for all
  using ((select public.can_manage_budget()))
  with check ((select public.can_manage_budget()));

drop policy if exists "membership_fee_records_select" on public.membership_fee_records;
create policy "membership_fee_records_select"
  on public.membership_fee_records for select
  using (
    user_id = (select auth.uid())
    or (select public.can_manage_budget())
  );

drop policy if exists "membership_fee_records_insert" on public.membership_fee_records;
create policy "membership_fee_records_insert"
  on public.membership_fee_records for insert
  with check ((select public.can_manage_budget()));

drop policy if exists "membership_fee_records_update" on public.membership_fee_records;
create policy "membership_fee_records_update"
  on public.membership_fee_records for update
  using ((select public.can_manage_budget()))
  with check ((select public.can_manage_budget()));

drop policy if exists "membership_fee_records_delete" on public.membership_fee_records;
create policy "membership_fee_records_delete"
  on public.membership_fee_records for delete
  using ((select public.can_manage_budget()));

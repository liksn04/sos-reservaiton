-- ============================================================
-- 역할 분리 취소 — 기존 is_admin 권한 모델로 복구
-- ============================================================

-- 1. 예약 변경 이력 조회는 기존 관리자 권한 기준으로 유지
drop policy if exists "reservation_change_log_select_relevant" on public.reservation_change_log;
create policy "reservation_change_log_select_relevant"
  on public.reservation_change_log for select
  using (
    (select public.is_admin_user())
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

-- 2. 예약/초대 관리는 호스트 또는 관리자 기준으로 복구
drop policy if exists "reservations_update_host" on public.reservations;
create policy "reservations_update_host"
  on public.reservations for update
  using (
    host_id = (select auth.uid())
    or (select public.is_admin_user())
  )
  with check (
    (
      host_id = (select auth.uid())
      or (select public.is_admin_user())
    )
    and (
      purpose <> '오디션'
      or (select public.is_admin_user())
    )
  );

drop policy if exists "reservations_delete_host" on public.reservations;
create policy "reservations_delete_host"
  on public.reservations for delete
  using (
    host_id = (select auth.uid())
    or (select public.is_admin_user())
  );

drop policy if exists "invitees_insert_host" on public.reservation_invitees;
create policy "invitees_insert_host"
  on public.reservation_invitees for insert
  with check (
    (select public.is_approved())
    and (
      (select public.is_admin_user())
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
    or (select public.is_admin_user())
    or exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.host_id = (select auth.uid())
    )
  );

-- 3. 예산 관리는 관리자 기준으로 복구
drop policy if exists "budget_categories_insert" on public.budget_categories;
create policy "budget_categories_insert"
  on public.budget_categories for insert
  with check ((select public.is_admin_user()));

drop policy if exists "budget_categories_update" on public.budget_categories;
create policy "budget_categories_update"
  on public.budget_categories for update
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "budget_categories_delete" on public.budget_categories;
create policy "budget_categories_delete"
  on public.budget_categories for delete
  using ((select public.is_admin_user()));

drop policy if exists "budget_transactions: budget managers only" on public.budget_transactions;
drop policy if exists "budget_transactions: admin only" on public.budget_transactions;
create policy "budget_transactions: admin only"
  on public.budget_transactions for all
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "membership_fee_policies: budget managers only" on public.membership_fee_policies;
drop policy if exists "membership_fee_policies: admin only" on public.membership_fee_policies;
create policy "membership_fee_policies: admin only"
  on public.membership_fee_policies for all
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "membership_fee_records_select" on public.membership_fee_records;
create policy "membership_fee_records_select"
  on public.membership_fee_records for select
  using (
    user_id = (select auth.uid())
    or (select public.is_admin_user())
  );

drop policy if exists "membership_fee_records_insert" on public.membership_fee_records;
create policy "membership_fee_records_insert"
  on public.membership_fee_records for insert
  with check ((select public.is_admin_user()));

drop policy if exists "membership_fee_records_update" on public.membership_fee_records;
create policy "membership_fee_records_update"
  on public.membership_fee_records for update
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "membership_fee_records_delete" on public.membership_fee_records;
create policy "membership_fee_records_delete"
  on public.membership_fee_records for delete
  using ((select public.is_admin_user()));

-- 4. 역할 분리 DB 객체 제거
drop function if exists public.can_manage_budget();
drop function if exists public.can_manage_reservations();
drop function if exists public.has_member_role(text[]);

alter table public.profiles
  drop constraint if exists profiles_member_role_check;

alter table public.profiles
  drop column if exists member_role;

alter table public.reservations
  drop constraint if exists reservations_purpose_check;

alter table public.reservations
  add constraint reservations_purpose_check
  check (purpose in ('합주', '강습', '정기회의', '오디션'));

drop policy if exists "reservations_insert_approved" on public.reservations;

create policy "reservations_insert_approved"
  on public.reservations
  for insert
  with check (
    (select public.is_approved())
    and host_id = (select auth.uid())
    and (
      purpose <> '오디션'
      or (select public.is_admin_user())
    )
  );

drop policy if exists "reservations_update_host" on public.reservations;

create policy "reservations_update_host"
  on public.reservations
  for update
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

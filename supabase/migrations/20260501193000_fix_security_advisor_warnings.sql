-- ============================================================
-- Supabase security advisor warnings cleanup
-- - Fix mutable search_path on public functions.
-- - Prevent direct RPC execution of internal SECURITY DEFINER functions.
-- - Remove broad public listing policies from public storage buckets.
-- ============================================================

do $$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'normalize_reservation_team_name',
        'touch_push_subscriptions_updated_at',
        'touch_reservation_reminder_deliveries_updated_at',
        'is_approved',
        'is_admin_user',
        'touch_club_events_updated_at',
        'current_profile_name',
        'handle_new_user',
        'is_same_day_hanju_booking_season',
        'log_reservation_delete',
        'log_reservation_invitee_change',
        'log_reservation_update',
        'set_reservation_policy_season_defaults',
        'validate_reservation_policy_season_overlap',
        'validate_same_day_hanju_reservation'
      )
  loop
    execute format('alter function %s set search_path = public, pg_catalog', target_function);
  end loop;
end;
$$;

do $$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
      and p.proname in (
        'current_profile_name',
        'handle_new_user',
        'is_admin_user',
        'is_approved',
        'is_same_day_hanju_booking_season',
        'log_reservation_delete',
        'log_reservation_invitee_change',
        'log_reservation_update',
        'set_reservation_policy_season_defaults',
        'validate_reservation_policy_season_overlap',
        'validate_same_day_hanju_reservation'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', target_function);
  end loop;
end;
$$;

drop policy if exists "avatars_public_select" on storage.objects;
drop policy if exists "Anyone can view receipts" on storage.objects;

drop policy if exists "avatars_owner_select" on storage.objects;
create policy "avatars_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts_owner_select" on storage.objects;
create policy "receipts_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

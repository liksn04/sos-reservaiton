-- Restore RLS helper execution without exposing SECURITY DEFINER functions
-- through the public API schema.

create schema if not exists private;

create or replace function private.is_approved()
returns boolean
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and status = 'approved'
  );
$$;

create or replace function private.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_admin = true
      and status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security invoker
stable
set search_path = private, public, pg_catalog
as $$
  select private.is_approved();
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
security invoker
stable
set search_path = private, public, pg_catalog
as $$
  select private.is_admin_user();
$$;

revoke all on function private.is_approved() from public;
revoke all on function private.is_admin_user() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_approved() to anon, authenticated;
grant execute on function private.is_admin_user() to anon, authenticated;

grant execute on function public.is_approved() to anon, authenticated;
grant execute on function public.is_admin_user() to anon, authenticated;

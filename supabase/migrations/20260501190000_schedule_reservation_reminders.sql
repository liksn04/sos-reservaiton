-- ============================================================
-- 예약 리마인더 Supabase Cron 스케줄
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.cron_secrets (
  name       text primary key,
  secret     text not null,
  updated_at timestamptz not null default now()
);

revoke all on private.cron_secrets from anon, authenticated;

do $$
begin
  perform cron.unschedule('send-reservation-reminders');
exception
  when others then
    null;
end;
$$;

select cron.schedule(
  'send-reservation-reminders',
  '*/5 * * * *',
  $$
  select
    net.http_post(
      url := (select secret from private.cron_secrets where name = 'reservation_reminder_project_url')
        || '/functions/v1/send-reservation-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select secret from private.cron_secrets where name = 'reservation_reminder_anon_key'),
        'x-cron-secret', (select secret from private.cron_secrets where name = 'reservation_reminder_cron_secret')
      ),
      body := jsonb_build_object('triggered_at', now())
    ) as request_id;
  $$
);

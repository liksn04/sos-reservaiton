do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'event_participant_counts'
  ) then
    alter publication supabase_realtime add table public.event_participant_counts;
  end if;
end;
$$;

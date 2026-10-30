-- The scheduled-DM and DM-flow follow-up sweeps are security definer and
-- meant for pg_cron only, but Postgres grants EXECUTE to PUBLIC by default
-- (and Supabase also grants it to anon/authenticated), which exposed them
-- at /rest/v1/rpc/* to anyone holding the public anon key: sending due
-- DMs early on demand and expiring flow sessions out of band.
--
-- pg_cron runs these as postgres, the owner, so the cron jobs are
-- unaffected.

revoke execute on function public.send_scheduled_dms()
  from public, anon, authenticated;

revoke execute on function public.send_dm_flow_followups()
  from public, anon, authenticated;

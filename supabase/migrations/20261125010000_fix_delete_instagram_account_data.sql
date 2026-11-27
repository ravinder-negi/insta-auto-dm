-- ============================================================
-- Fix delete_instagram_account_data: stop deleting from
-- public.webhook_debug_events.
--
-- That table was dropped in 20261019020000_drop_webhook_debug_log.sql, but
-- the function (added in 20261119000000) still referenced it. plpgsql only
-- resolves table names at execution time, so the migration applied cleanly
-- and every call failed with:
--   relation "public.webhook_debug_events" does not exist
-- which broke account disconnect and Meta data deletion requests.
--
-- webhook_events and automation_executions are ON DELETE SET NULL (so they
-- survive a plain row delete), so they are removed explicitly first, in the
-- same transaction. Everything else cascades from instagram_accounts.
-- ============================================================

create or replace function public.delete_instagram_account_data(account_ids uuid[])
returns integer
language plpgsql
set search_path = public
as $$
declare
  deleted integer;
begin
  delete from public.webhook_events where instagram_account_id = any(account_ids);
  delete from public.automation_executions where instagram_account_id = any(account_ids);

  delete from public.instagram_accounts where id = any(account_ids);
  get diagnostics deleted = row_count;

  return deleted;
end;
$$;

revoke execute on function public.delete_instagram_account_data(uuid[])
  from public, anon, authenticated;
grant execute on function public.delete_instagram_account_data(uuid[])
  to service_role;

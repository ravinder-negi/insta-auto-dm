-- Explicit Data API grants for anon / authenticated / service_role.
--
-- Older Supabase projects (and the CLI's local default, see
-- `auto_expose_new_tables` in config.toml) auto-grant every new public table
-- to the API roles. Newer cloud projects do not, so on such a project every
-- PostgREST call fails with "permission denied for table <name>" — e.g. the
-- onboarding update of public.profiles. None of the earlier migrations granted
-- table privileges, because they relied on that auto-grant.
--
-- This restores the classic grants explicitly. It is safe because every public
-- table has RLS enabled: the grant only lets a role *reach* the table, the
-- row policies still decide what it can see or change (no policy = no rows).
-- The column-level lockdowns from 20261103000000 / 20261103010000 /
-- 20261103020000 are re-applied below, since the blanket grant would undo them.
--
-- Idempotent: on a project that already had the auto-grants this is a no-op.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- Re-apply lockdowns (keep in sync with the original migrations)
-- ------------------------------------------------------------

-- 20261103000000_lock_down_instagram_accounts: no access_token, no inserts.
revoke all on table public.instagram_accounts from anon, authenticated;

grant select (
  id,
  profile_id,
  instagram_user_id,
  username,
  is_active,
  created_at,
  updated_at,
  token_expires_at,
  token_refreshed_at,
  token_status,
  token_error
) on table public.instagram_accounts to authenticated;

grant update (is_active, updated_at) on table public.instagram_accounts to authenticated;

grant delete on table public.instagram_accounts to authenticated;

-- 20261103010000_lock_down_lead_magnet_files: file_url is service-role only.
revoke select on table public.lead_magnets from anon, authenticated;

grant select (
  id,
  profile_id,
  title,
  description,
  file_name,
  position,
  is_active,
  created_at,
  updated_at
) on table public.lead_magnets to anon, authenticated;

-- 20261103020000_processed_inbound_messages: service role only.
revoke all on table public.processed_inbound_messages from anon, authenticated;

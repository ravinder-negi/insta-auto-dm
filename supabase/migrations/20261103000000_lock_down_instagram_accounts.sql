-- instagram_accounts had full CRUD for its owner through RLS, with no column
-- restrictions. That let any signed-in user:
--   * read their long-lived Instagram access_token from the browser (anon
--     key + session), so any XSS or extension could exfiltrate it, and
--   * insert or update a row with any instagram_user_id (unique), squatting
--     someone else's Instagram account so its real owner can't connect it.
--
-- Accounts are now written only by the OAuth callback, which proves who owns
-- the Instagram id and stores it with the service role
-- (src/app/api/instagram/callback/route.ts). Tokens are read server-side with
-- the service role (src/lib/instagram/tokens.ts). The edge functions and the
-- security definer cron sweeps are unaffected.
--
-- Users keep: reading every column except access_token, pausing/resuming
-- (is_active, updated_at) and disconnecting (delete).

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

drop policy if exists "instagram_accounts_insert_own" on public.instagram_accounts;

-- Every ownership policy on the automation tables subqueries
-- instagram_accounts by profile_id.
create index if not exists idx_instagram_accounts_profile_id
  on public.instagram_accounts (profile_id);

-- ============================================================
-- Meta Deauthorize + Data Deletion callbacks.
--
-- Meta identifies the person in both callbacks only by their app-scoped
-- Facebook user id (signed_request.user_id). The connect flow stores it as
-- meta_user_id (taken from debug_token) so the callbacks can find the
-- Instagram accounts that person connected.
-- ============================================================

alter table public.instagram_accounts
  add column meta_user_id text;

comment on column public.instagram_accounts.meta_user_id is
  'App-scoped Facebook user id of the person who connected the account (debug_token user_id). Matches signed_request.user_id in the Meta deauthorize and data deletion callbacks.';

create index instagram_accounts_meta_user_id_idx
  on public.instagram_accounts(meta_user_id)
  where meta_user_id is not null;

-- ============================================================
-- One row per data deletion request Meta sends. The confirmation code is
-- returned to Meta and shown to the person on /data-deletion/status.
-- Written and read only by the server (service role); no RLS policies.
-- ============================================================

create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),

  confirmation_code text not null unique,
  meta_user_id text not null,

  -- Deletion runs synchronously inside the callback, so a request is either
  -- done or matched nothing.
  status text not null check (status in ('completed', 'no_data')),
  deleted_accounts integer not null default 0,

  created_at timestamptz not null default now()
);

alter table public.data_deletion_requests enable row level security;

-- ============================================================
-- Deletes the given Instagram accounts and every record sourced from them.
--
-- Most tables cascade from instagram_accounts, but webhook_events,
-- webhook_debug_events and automation_executions are ON DELETE SET NULL
-- (so a plain disconnect keeps history). A Meta data deletion request must
-- remove that history too, so those go first, in the same transaction.
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
  delete from public.webhook_debug_events where instagram_account_id = any(account_ids);
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

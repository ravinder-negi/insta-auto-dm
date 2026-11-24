-- ============================================================
-- Token health check.
--
-- When a client removes DMLink from Facebook / their business portfolio,
-- Meta revokes the system-user token but does NOT call the deauthorize
-- callback (tested 2026-11-19), and stops sending webhook events. Nothing
-- then tries the token, so the webhook's code-190 check never runs and the
-- dashboard keeps showing the account as healthy while automations are dead.
--
-- This sweep asks Meta directly: every active account's token is tried at
-- most once an hour with a cheap GET /{ig-user-id}?fields=id. pg_net is
-- asynchronous, so each run first settles the answers to the previous run's
-- requests. A code 190 answer flags the token expired through
-- instagram_send_error(), the same as live and cron sends, and the
-- dashboard shows the reconnect banner.
-- ============================================================

alter table public.instagram_accounts
  add column token_check_request_id bigint,
  add column token_checked_at timestamptz;

comment on column public.instagram_accounts.token_check_request_id is
  'pg_net request id of the pending token health check; cleared once settled or on reconnect.';
comment on column public.instagram_accounts.token_checked_at is
  'When the last token health check was queued.';

create or replace function public.check_instagram_tokens()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  checked record;
  request_id bigint;
begin
  -- 1. Settle earlier checks. instagram_send_error() flags code 190 and
  -- ignores anything else (a Meta outage must not log clients out).
  -- A reconnect clears token_check_request_id, so an answer about the old
  -- token can't expire the new one.
  for checked in
    select ia.id, r as response
    from public.instagram_accounts ia
    join net._http_response r on r.id = ia.token_check_request_id
    where ia.token_check_request_id is not null
  loop
    perform public.instagram_send_error(checked.response, checked.id);
  end loop;

  update public.instagram_accounts ia
    set token_check_request_id = null
    where ia.token_check_request_id is not null
      and (
        exists (select 1 from net._http_response r where r.id = ia.token_check_request_id)
        -- No answer recorded: treat as lost and try again next hour.
        or ia.token_checked_at < now() - interval '15 minutes'
      );

  -- 2. Queue a check for every active token not tried in the last hour.
  for checked in
    select ia.id, ia.instagram_user_id, ia.access_token
    from public.instagram_accounts ia
    where ia.token_status = 'active'
      and ia.meta_config_id is not null
      and ia.token_check_request_id is null
      and (ia.token_checked_at is null or ia.token_checked_at < now() - interval '1 hour')
    order by ia.token_checked_at nulls first
    limit 500
  loop
    request_id := net.http_get(
      url := format(
        'https://graph.facebook.com/v27.0/%s?fields=id',
        checked.instagram_user_id
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || checked.access_token
      ),
      timeout_milliseconds := 10000
    );

    update public.instagram_accounts
      set token_check_request_id = request_id,
          token_checked_at = now()
      where id = checked.id;
  end loop;
end;
$$;

-- Cron-only: it reads access tokens.
revoke execute on function public.check_instagram_tokens()
  from public, anon, authenticated;

-- Every 15 minutes, so a revoked token is flagged within ~75 minutes.
-- Each token is still only tried once an hour.
select cron.schedule(
  'check-instagram-tokens',
  '*/15 * * * *',
  $$select public.check_instagram_tokens();$$
);

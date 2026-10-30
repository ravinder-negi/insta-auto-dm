-- ============================================================
-- Instagram token refresh.
--
-- Long-lived Instagram Login tokens expire ~60 days after they're issued.
-- Until now nothing refreshed them, so every account silently stopped
-- sending two months after connecting. The refresh-instagram-tokens edge
-- function now swaps each token for a fresh one inside its last 10 days,
-- triggered daily by pg_cron below.
--
-- A token Meta rejects (refresh failure or a send failing with code 190)
-- is marked expired; the dashboard then asks the owner to reconnect, and
-- reconnecting resets it to active.
-- ============================================================

alter table public.instagram_accounts
  add column token_expires_at timestamptz,
  add column token_refreshed_at timestamptz,
  add column token_status text not null default 'active'
    check (token_status in ('active', 'expired')),
  add column token_error text;

-- Existing tokens were issued at their last connect, which is no later than
-- updated_at — a safe stand-in for the 24-hour minimum age Meta enforces
-- before a refresh. Their real expiry is unknown, so token_expires_at stays
-- null and the first refresh run picks them up.
update public.instagram_accounts
  set token_refreshed_at = updated_at;

alter table public.instagram_accounts
  alter column token_refreshed_at set default now(),
  alter column token_refreshed_at set not null;

create index idx_instagram_accounts_token_expiry
  on public.instagram_accounts(token_expires_at)
  where token_status = 'active';

-- ============================================================
-- Scheduled DM sweep: skip dead tokens, drop stale sends.
-- A send against an expired token would fail at Meta yet still be marked
-- sent here, so those rows now wait. And anything more than a day overdue
-- (an expired token, or a paused account) is canceled instead of sent —
-- it would land long after the moment it was meant for, and is usually
-- outside Instagram's messaging window anyway.
-- ============================================================

create or replace function public.send_scheduled_dms()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
begin
  update public.scheduled_dms
    set status = 'canceled'
    where status = 'pending'
      and send_after < now() - interval '24 hours';

  for due in
    select
      d.id,
      d.recipient_ig_id,
      d.recipient_comment_id,
      coalesce(d.message_payload, jsonb_build_object('text', d.message)) as message,
      ia.instagram_user_id,
      ia.access_token
    from public.scheduled_dms d
    join public.instagram_accounts ia
      on ia.id = d.instagram_account_id
    where d.status = 'pending'
      and d.send_after <= now()
      and ia.is_active = true
      and ia.token_status = 'active'
    order by d.send_after
    limit 200
  loop
    -- Fire-and-forget, like the DM flow sweep: pg_net queues the request
    -- and records the response in net._http_response. A failed send isn't
    -- retried, matching the webhook's own best-effort sends.
    perform net.http_post(
      url := format(
        'https://graph.instagram.com/v26.0/%s/messages',
        due.instagram_user_id
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || due.access_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'recipient',
        case
          when due.recipient_comment_id is not null
            then jsonb_build_object('comment_id', due.recipient_comment_id)
          else jsonb_build_object('id', due.recipient_ig_id)
        end,
        'message', due.message
      )
    );

    update public.scheduled_dms
      set status = 'sent', sent_at = now()
      where id = due.id;
  end loop;
end;
$$;

-- ============================================================
-- DM flow follow-ups: same expired-token guard. A follow-up held back
-- while the token is dead goes out after reconnect if the session hasn't
-- expired by then; the expiry rules below are unchanged.
-- ============================================================

create or replace function public.send_dm_flow_followups()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
begin
  for due in
    select
      s.id as session_id,
      s.ig_sender_id,
      st.followup_message,
      ia.instagram_user_id,
      ia.access_token
    from public.dm_flow_sessions s
    join public.dm_flow_steps st
      on st.flow_id = s.flow_id and st.step_order = s.current_step_order
    join public.instagram_accounts ia
      on ia.id = s.instagram_account_id
    where s.status = 'active'
      and ia.token_status = 'active'
      and st.expects_reply = true
      and st.followup_enabled = true
      and st.followup_delay_hours is not null
      and st.followup_message is not null
      and s.followup_sent_at is null
      and s.last_interaction_at < now() - (st.followup_delay_hours || ' hours')::interval
  loop
    perform net.http_post(
      url := format(
        'https://graph.instagram.com/v26.0/%s/messages',
        due.instagram_user_id
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || due.access_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'recipient', jsonb_build_object('id', due.ig_sender_id),
        'message', jsonb_build_object('text', due.followup_message)
      )
    );

    update public.dm_flow_sessions
      set followup_sent_at = now()
      where id = due.session_id;
  end loop;

  -- Already nudged, still silent followup_delay_hours later.
  update public.dm_flow_sessions s
  set status = 'expired'
  from public.dm_flow_steps st
  where st.flow_id = s.flow_id
    and st.step_order = s.current_step_order
    and s.status = 'active'
    and s.followup_sent_at is not null
    and st.followup_delay_hours is not null
    and s.followup_sent_at < now() - (st.followup_delay_hours || ' hours')::interval;

  -- No follow-up was ever configured for the step it's stuck on — give up
  -- after a fixed, generous silence window instead of staying open forever.
  update public.dm_flow_sessions s
  set status = 'expired'
  from public.dm_flow_steps st
  where st.flow_id = s.flow_id
    and st.step_order = s.current_step_order
    and s.status = 'active'
    and not (st.followup_enabled and st.followup_delay_hours is not null)
    and s.last_interaction_at < now() - interval '14 days';
end;
$$;

-- ============================================================
-- Daily trigger for the refresh-instagram-tokens edge function.
--
-- The function URL and shared secret live in Vault, not in this file:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<random>', 'token_refresh_cron_secret');
-- and the same secret is set on the function:
--   supabase secrets set TOKEN_REFRESH_CRON_SECRET=<random>
-- Until both Vault secrets exist the job logs a warning and does nothing.
-- ============================================================

create or replace function public.invoke_instagram_token_refresh()
returns void
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  project_url text;
  cron_secret text;
begin
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into cron_secret
    from vault.decrypted_secrets where name = 'token_refresh_cron_secret';

  if project_url is null or cron_secret is null then
    raise warning 'Instagram token refresh skipped: project_url or token_refresh_cron_secret missing from Vault';
    return;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/refresh-instagram-tokens',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

-- It reads Vault secrets, so it must never be callable through the API.
revoke execute on function public.invoke_instagram_token_refresh()
  from public, anon, authenticated;

-- 03:17 UTC daily: off the hour, away from other scheduled load.
select cron.schedule(
  'refresh-instagram-tokens',
  '17 3 * * *',
  $$select public.invoke_instagram_token_refresh();$$
);

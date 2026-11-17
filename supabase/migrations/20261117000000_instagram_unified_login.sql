-- ============================================================
-- Instagram API with Unified Login.
--
-- Accounts now connect through a Facebook Login for Business configuration
-- and hold a Business Integration System User token: it belongs to the
-- client's business portfolio, never expires, and is used on
-- graph.facebook.com (not graph.instagram.com) with the explicit Instagram
-- account id.
-- ============================================================

alter table public.instagram_accounts
  add column client_business_id text,
  add column meta_config_id text;

comment on column public.instagram_accounts.client_business_id is
  'Business portfolio the client picked at Unified Login; the token belongs to it.';
comment on column public.instagram_accounts.meta_config_id is
  'App Dashboard Unified Login configuration the token was issued under.';

-- Pre-launch rows still hold Instagram Login tokens, which graph.facebook.com
-- rejects. Park them so the sweeps skip them and the dashboard asks for a
-- reconnect, which replaces the token and resets the status.
update public.instagram_accounts
  set token_status = 'expired',
      token_error = 'Reconnect this account to switch to the new Instagram login.'
  where meta_config_id is null;

-- ============================================================
-- No refresh job: system-user tokens don't expire. A token Meta rejects
-- (app removed from the portfolio, account moved) is still flagged expired
-- by the webhook on code 190.
-- ============================================================

do $$
begin
  if exists (select 1 from cron.job where jobname = 'refresh-instagram-tokens') then
    perform cron.unschedule('refresh-instagram-tokens');
  end if;
end;
$$;

drop function if exists public.invoke_instagram_token_refresh();

-- ============================================================
-- Cron sweeps: same as 20261030020000, sent to graph.facebook.com.
-- ============================================================

create or replace function public.send_scheduled_dms()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
  request_id bigint;
begin
  perform public.reconcile_cron_sends();

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
    request_id := net.http_post(
      url := format(
        'https://graph.facebook.com/v27.0/%s/messages',
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
      set status = 'sending', sent_at = now(), net_request_id = request_id
      where id = due.id;
  end loop;
end;
$$;

create or replace function public.send_dm_flow_followups()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
  request_id bigint;
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
    request_id := net.http_post(
      url := format(
        'https://graph.facebook.com/v27.0/%s/messages',
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
      set followup_sent_at = now(), followup_request_id = request_id
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

-- Cron-only, like the sweeps (see 20261030010000).
revoke execute on function public.send_scheduled_dms()
  from public, anon, authenticated;

revoke execute on function public.send_dm_flow_followups()
  from public, anon, authenticated;

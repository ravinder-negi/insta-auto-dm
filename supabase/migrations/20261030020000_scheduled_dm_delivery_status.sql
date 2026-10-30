-- ============================================================
-- Delivery status for cron-sent DMs.
--
-- The scheduled-DM and DM-flow follow-up sweeps send through pg_net,
-- fire-and-forget: a row was marked sent the moment the request was
-- queued, whatever Instagram answered. And a delayed rule DM left its
-- automation_executions row at 'scheduled' for good, so analytics (which
-- count 'sent' and 'failed') never saw delayed DMs at all.
--
-- Now each send records its pg_net request id, and the next sweep reads
-- Instagram's answer from net._http_response:
--   scheduled_dms   pending -> sending -> sent | failed (with the error)
--   executions      scheduled -> sent | failed, once all of its DM rows
--                   have settled (canceled counts as failed)
--   follow-ups      followup_error records a rejected nudge
-- A code 190 answer marks the account's token expired, the same as the
-- webhook does for live sends.
-- ============================================================

alter table public.scheduled_dms
  add column automation_execution_id uuid
    references public.automation_executions(id)
    on delete set null,
  add column net_request_id bigint,
  add column error_message text;

alter table public.scheduled_dms
  drop constraint scheduled_dms_status_check,
  add constraint scheduled_dms_status_check
    check (status in ('pending', 'sending', 'sent', 'failed', 'canceled'));

create index idx_scheduled_dms_sending
  on public.scheduled_dms(net_request_id)
  where status = 'sending';

create index idx_scheduled_dms_execution
  on public.scheduled_dms(automation_execution_id)
  where automation_execution_id is not null;

alter table public.dm_flow_sessions
  add column followup_request_id bigint,
  add column followup_error text;

create index idx_dm_flow_sessions_followup_request
  on public.dm_flow_sessions(followup_request_id)
  where followup_request_id is not null and followup_error is null;

-- ============================================================
-- Turns one pg_net response into an error message, or null on success.
-- Flags the account when Instagram rejected the token (code 190).
-- ============================================================

create or replace function public.instagram_send_error(
  response net._http_response,
  account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, net
as $$
declare
  body jsonb;
  message text;
begin
  if response.status_code between 200 and 299 then
    return null;
  end if;

  if response.timed_out or response.status_code is null then
    return coalesce('Network error: ' || response.error_msg, 'No response from Instagram API');
  end if;

  begin
    body := response.content::jsonb;
  exception when others then
    body := null;
  end;

  message := 'Instagram API ' || response.status_code || ': '
    || coalesce(body->'error'->>'message', left(response.content, 300));

  if (body->'error'->>'code') = '190' then
    update public.instagram_accounts
      set token_status = 'expired',
          token_error = (body->'error'->>'message') || ' (code 190)'
      where id = account_id
        and token_status = 'active';
  end if;

  return message;
end;
$$;

-- ============================================================
-- Settles sends from earlier sweeps. pg_net answers within seconds, and
-- keeps responses for ~6 hours; a send with no answer after 15 minutes
-- is treated as lost.
-- ============================================================

create or replace function public.reconcile_cron_sends()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  sent record;
  failure text;
begin
  for sent in
    select d.id, d.instagram_account_id, d.sent_at, r as response, r.id as response_id
    from public.scheduled_dms d
    left join net._http_response r on r.id = d.net_request_id
    where d.status = 'sending'
      and (r.id is not null or d.sent_at < now() - interval '15 minutes')
  loop
    failure := case
      when sent.response_id is null then 'No response from Instagram API recorded'
      else public.instagram_send_error(sent.response, sent.instagram_account_id)
    end;

    update public.scheduled_dms
      set status = case when failure is null then 'sent' else 'failed' end,
          error_message = failure
      where id = sent.id;
  end loop;

  -- An execution is settled once none of its DM rows are still queued.
  update public.automation_executions e
    set status = settled.status,
        error_message = settled.error_message,
        updated_at = now()
    from (
      select
        d.automation_execution_id as execution_id,
        case
          when bool_or(d.status in ('failed', 'canceled')) then 'failed'
          else 'sent'
        end as status,
        max(coalesce(d.error_message, 'Canceled: more than 24 hours overdue'))
          filter (where d.status in ('failed', 'canceled')) as error_message
      from public.scheduled_dms d
      join public.automation_executions pending_execution
        on pending_execution.id = d.automation_execution_id
       and pending_execution.status = 'scheduled'
      group by d.automation_execution_id
      having bool_and(d.status in ('sent', 'failed', 'canceled'))
    ) settled
    where e.id = settled.execution_id;

  for sent in
    select s.id, s.instagram_account_id, r as response
    from public.dm_flow_sessions s
    join net._http_response r on r.id = s.followup_request_id
    where s.followup_request_id is not null
      and s.followup_error is null
      and not coalesce(r.status_code between 200 and 299, false)
  loop
    update public.dm_flow_sessions
      set followup_error = public.instagram_send_error(sent.response, sent.instagram_account_id)
      where id = sent.id;
  end loop;

  -- Successful follow-ups need no further checks.
  update public.dm_flow_sessions s
    set followup_request_id = null
    from net._http_response r
    where r.id = s.followup_request_id
      and r.status_code between 200 and 299;
end;
$$;

-- ============================================================
-- Scheduled DM sweep: as before, but settles earlier sends first and
-- records each request id instead of assuming success.
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
      set status = 'sending', sent_at = now(), net_request_id = request_id
      where id = due.id;
  end loop;
end;
$$;

-- ============================================================
-- DM flow follow-ups: unchanged apart from recording the request id.
-- ============================================================

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
revoke execute on function public.instagram_send_error(net._http_response, uuid)
  from public, anon, authenticated;
revoke execute on function public.reconcile_cron_sends()
  from public, anon, authenticated;

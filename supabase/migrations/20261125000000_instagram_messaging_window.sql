-- ============================================================
-- Instagram's 24-hour messaging window.
--
-- Instagram only accepts a DM addressed by user id within 24 hours of that
-- person's last message to the account. A comment private reply (addressed
-- by comment_id) is the one exception, and it allows a single message.
-- Sends outside the window fail with error_subcode 2534022 and count
-- against the app with Meta, so:
--
--   1. Every delay a user can configure is capped at 23 hours:
--        automation_rules.send_delay_seconds        <= 82800
--        automation_rule_followups.delay_minutes    <= 1380
--        dm_flow_steps.followup_delay_hours         1..23
--      Existing rows above a cap are lowered to it.
--   2. instagram_messaging_windows records when each person last messaged
--      each account (written by the webhook on every inbound DM).
--   3. Both cron sweeps only send by user id while that person's window is
--      still open. Anything else is canceled (scheduled_dms) or skipped
--      (DM-flow follow-ups) with an error saying why. That is also what
--      stops follow-ups after a comment-triggered DM unless the commenter
--      has since replied.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Caps
-- ------------------------------------------------------------

update public.automation_rules
  set send_delay_seconds = 82800
  where send_delay_seconds > 82800;

alter table public.automation_rules
  drop constraint automation_rules_send_delay_check,
  add constraint automation_rules_send_delay_check
    check (send_delay_seconds >= 0 and send_delay_seconds <= 82800);

update public.automation_rule_followups
  set delay_minutes = 1380
  where delay_minutes > 1380;

alter table public.automation_rule_followups
  drop constraint automation_rule_followups_delay_minutes_check,
  add constraint automation_rule_followups_delay_minutes_check
    check (delay_minutes > 0 and delay_minutes <= 1380);

update public.dm_flow_steps
  set followup_delay_hours = 23
  where followup_delay_hours > 23;

alter table public.dm_flow_steps
  add constraint dm_flow_steps_followup_delay_hours_check
    check (followup_delay_hours is null or followup_delay_hours between 1 and 23);

-- ------------------------------------------------------------
-- 2. Last inbound message per person per account
-- ------------------------------------------------------------

create table public.instagram_messaging_windows (
  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  -- Instagram-scoped id of the person who messaged the account.
  ig_user_id text not null,

  last_inbound_at timestamptz not null,

  primary key (instagram_account_id, ig_user_id)
);

comment on table public.instagram_messaging_windows is
  'When each person last messaged each account; a DM by user id is only allowed within 24 hours of it.';

-- Written and read by the webhook (service role) and the cron sweeps only:
-- RLS on with no policies, so the API roles see no rows.
alter table public.instagram_messaging_windows enable row level security;

-- Moves the window forward, never back, so an out-of-order webhook
-- delivery can't shorten it.
create or replace function public.record_instagram_inbound_message(
  p_instagram_account_id uuid,
  p_ig_user_id text,
  p_at timestamptz
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.instagram_messaging_windows (instagram_account_id, ig_user_id, last_inbound_at)
  values (p_instagram_account_id, p_ig_user_id, p_at)
  on conflict (instagram_account_id, ig_user_id)
  do update set last_inbound_at = greatest(
    public.instagram_messaging_windows.last_inbound_at,
    excluded.last_inbound_at
  );
$$;

revoke execute on function public.record_instagram_inbound_message(uuid, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_instagram_inbound_message(uuid, text, timestamptz)
  to service_role;

-- True while a DM by user id is still allowed. Ten minutes short of 24 hours
-- so a request pg_net queues now doesn't land just after the window shuts.
create or replace function public.instagram_window_open(
  p_instagram_account_id uuid,
  p_ig_user_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.instagram_messaging_windows w
    where w.instagram_account_id = p_instagram_account_id
      and w.ig_user_id = p_ig_user_id
      and w.last_inbound_at > now() - interval '23 hours 50 minutes'
  );
$$;

revoke execute on function public.instagram_window_open(uuid, text)
  from public, anon, authenticated;

-- ------------------------------------------------------------
-- 3. Sweeps: as in 20261117000000, plus the window check.
-- ------------------------------------------------------------

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

  -- Due sends by user id whose recipient's window has closed (or never
  -- opened, e.g. a follow-up to a commenter who never replied).
  update public.scheduled_dms d
    set status = 'canceled',
        error_message = 'Canceled: outside Instagram''s 24-hour messaging window'
    where d.status = 'pending'
      and d.send_after <= now()
      and d.recipient_comment_id is null
      and not public.instagram_window_open(d.instagram_account_id, d.recipient_ig_id);

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
  -- Due nudges whose recipient's window has closed are skipped, not sent.
  -- followup_sent_at is still stamped so the session expires on the normal
  -- schedule below; followup_error records why nothing went out.
  update public.dm_flow_sessions s
    set followup_sent_at = now(),
        followup_error = 'Skipped: outside Instagram''s 24-hour messaging window'
    from public.dm_flow_steps st
    where st.flow_id = s.flow_id
      and st.step_order = s.current_step_order
      and s.status = 'active'
      and st.expects_reply = true
      and st.followup_enabled = true
      and st.followup_delay_hours is not null
      and st.followup_message is not null
      and s.followup_sent_at is null
      and s.last_interaction_at < now() - (st.followup_delay_hours || ' hours')::interval
      and not public.instagram_window_open(s.instagram_account_id, s.ig_sender_id);

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

-- Cron-only, like the sweeps (see 20261030020000).
revoke execute on function public.send_scheduled_dms()
  from public, anon, authenticated;

revoke execute on function public.send_dm_flow_followups()
  from public, anon, authenticated;

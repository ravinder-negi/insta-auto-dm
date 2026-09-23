-- Auto-expire DM flow sessions that never get a reply, so "active" always
-- means "genuinely still waiting" rather than accumulating ghosted
-- conversations forever. Two cutoffs, checked by the same sweep that sends
-- follow-ups (extending send_dm_flow_followups() rather than adding a
-- second cron job):
--
--   - A step with a follow-up configured: expire followup_delay_hours
--     after the follow-up was sent (i.e. the same grace period again,
--     post-nudge) if still no reply.
--   - A step with no follow-up configured: expire after a fixed 14-day
--     silence, so those sessions don't stay "active" indefinitely either.
--
-- Expiry is silent bookkeeping (status only) — no message is sent, since
-- a step that already sent a follow-up shouldn't get a second one, and a
-- step with no follow-up configured was never meant to prompt again.

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

-- Scheduled follow-up: a DM flow step waiting on a reply can define a
-- "no reply after N hours -> send this reminder" nudge. A pg_cron job
-- sweeps active sessions every 15 minutes and sends any that are due,
-- straight from Postgres via pg_net (no round-trip through the edge
-- function). Each session is nudged at most once per (session, step) —
-- followup_sent_at marks it as done so the sweep never repeats it.
--
-- Both pg_cron and pg_net are free Postgres extensions bundled by
-- Supabase on every plan, including the free tier — no external
-- scheduler/queue service involved.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.dm_flow_steps
  add column followup_enabled boolean not null default false,
  add column followup_delay_hours int,
  add column followup_message text;

alter table public.dm_flow_sessions
  add column followup_sent_at timestamptz;

-- security definer: the sweep runs on a schedule, not as any particular
-- authenticated user, so it needs to read across all accounts/sessions
-- the same way the webhook's service-role client does.
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
    -- Fire-and-forget: pg_net queues the request async and records the
    -- response in net._http_response for later inspection. A failed send
    -- here isn't retried — matches the webhook's own best-effort sends.
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
end;
$$;

select cron.schedule(
  'dm-flow-followups',
  '*/15 * * * *',
  $$select public.send_dm_flow_followups();$$
);

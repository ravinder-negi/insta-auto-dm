-- Saving a flow replaced its steps with two separate requests (delete all,
-- then insert). If the insert failed, an active flow was left with zero
-- steps: the webhook still matched it, found no step 1 and returned before
-- rule matching, so matching comments got no reply at all. Rule follow-ups
-- were replaced the same way.
--
-- Each replace now runs as one function call, so one transaction: the old
-- rows come back if the insert fails. security invoker keeps RLS in force,
-- so a caller who doesn't own the parent row deletes nothing and has the
-- insert rejected.

create or replace function public.replace_flow_steps(p_flow_id uuid, p_steps jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.dm_flow_steps where flow_id = p_flow_id;

  insert into public.dm_flow_steps (
    flow_id,
    step_order,
    message_text,
    expects_reply,
    collects_email,
    attachment_url,
    attachment_type,
    followup_enabled,
    followup_delay_hours,
    followup_message,
    intent_map,
    options,
    buttons,
    button_card_title
  )
  select
    p_flow_id,
    s.step_order,
    s.message_text,
    s.expects_reply,
    s.collects_email,
    s.attachment_url,
    s.attachment_type,
    s.followup_enabled,
    s.followup_delay_hours,
    s.followup_message,
    s.intent_map,
    s.options,
    s.buttons,
    s.button_card_title
  from jsonb_populate_recordset(null::public.dm_flow_steps, p_steps) as s;
end;
$$;

create or replace function public.replace_rule_followups(p_rule_id uuid, p_followups jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.automation_rule_followups where automation_rule_id = p_rule_id;

  insert into public.automation_rule_followups (automation_rule_id, step_order, delay_minutes, message)
  select p_rule_id, f.step_order, f.delay_minutes, f.message
  from jsonb_populate_recordset(null::public.automation_rule_followups, p_followups) as f;
end;
$$;

revoke execute on function public.replace_flow_steps(uuid, jsonb) from public, anon;
revoke execute on function public.replace_rule_followups(uuid, jsonb) from public, anon;
grant execute on function public.replace_flow_steps(uuid, jsonb) to authenticated;
grant execute on function public.replace_rule_followups(uuid, jsonb) to authenticated;

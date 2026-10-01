-- "Replies to your Story" trigger: automation_rules.trigger_type is now
-- actually read by the webhook (it was vestigial — every rule was
-- comment_keyword and the comment-matching query never filtered on it).
-- Story replies arrive as a messaging event, not a comment, so they have
-- no instagram_comment_id to dedupe on; they dedupe on the inbound
-- message's mid instead.

create index idx_automation_rules_trigger_type
  on public.automation_rules(trigger_type);

alter table public.automation_executions
  alter column instagram_comment_id drop not null;

alter table public.automation_executions
  add column inbound_message_id text;

create unique index idx_executions_inbound_message_id
  on public.automation_executions(inbound_message_id)
  where inbound_message_id is not null;

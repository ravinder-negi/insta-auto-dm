-- Optional media attachment sent alongside the text message, for both
-- automation_rules and dm_flow_steps. Confirmed live against
-- graph.instagram.com/{ig-user-id}/messages (Instagram Business Login) —
-- unlike quick-reply buttons, attachment messages work fine on this
-- integration, no Facebook Page link needed.
--
-- attachment_type is one of: image | video | audio | file (validated
-- app-side, same plain-text-column convention as other status/type
-- columns in this schema — see automation_executions.status).
--
-- Instagram's message object is text XOR attachment per API call, so when
-- both a message and an attachment are set, the webhook sends two
-- messages: text first, then the attachment — see
-- instagram-webhook/index.ts.

alter table public.automation_rules
  add column attachment_url text,
  add column attachment_type text;

alter table public.dm_flow_steps
  add column attachment_url text,
  add column attachment_type text;

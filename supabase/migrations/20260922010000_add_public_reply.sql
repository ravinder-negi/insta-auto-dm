-- Optional public comment reply, posted alongside the private DM, when a
-- rule or DM flow matches a comment keyword. Uses Instagram's public
-- comment-reply API (POST /{comment-id}/replies), distinct from the
-- private message send (POST /{ig-user-id}/messages) used for the DM
-- itself. For flows this fires once, when the flow is triggered — not
-- per step, since only the triggering comment has a comment_id to reply to.

alter table public.automation_rules
  add column send_public_reply boolean not null default false,
  add column public_reply_message text;

alter table public.dm_flows
  add column send_public_reply boolean not null default false,
  add column public_reply_message text;

-- Rolls back the quick-replies experiment (20260923030000). Instagram's
-- quick_replies field only works on the Facebook-Page-linked Messenger API
-- (graph.facebook.com/{page-id}/messages), not the standalone
-- graph.instagram.com/{ig-user-id}/messages endpoint this app uses via
-- Instagram Business Login — confirmed live: the request was accepted
-- (200 OK) but Instagram silently dropped the field and delivered plain
-- text, no buttons.

alter table public.dm_flow_steps
  drop column if exists quick_replies;

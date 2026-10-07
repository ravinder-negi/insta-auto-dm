-- Generic template default_action: the whole button card becomes tappable,
-- opening this URL, independent of its buttons. Only takes effect when the
-- rule already has buttons (no card is sent without them).
alter table public.automation_rules
  add column if not exists dm_default_action_url text;

-- Link buttons for the terminal step of a DM flow, mirroring
-- automation_rules.dm_buttons / dm_button_card_title.
alter table public.dm_flow_steps
  add column buttons jsonb not null default '[]'::jsonb,
  add column button_card_title text;

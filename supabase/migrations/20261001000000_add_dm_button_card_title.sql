-- Instagram renders link buttons through the generic template, which is a
-- card: it needs a title of its own, separate from the DM text that goes
-- out just before it.
alter table public.automation_rules
  add column dm_button_card_title text;

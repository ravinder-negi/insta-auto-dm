-- Rolls back the DM-buttons experiment (feature shelved for now).

alter table public.automation_rules
  drop constraint if exists automation_rules_buttons_shape;

alter table public.automation_rules
  drop column if exists buttons;

alter table public.automation_executions
  drop column if exists buttons_delivered_at;

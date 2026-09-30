-- Numbered text-reply options: replaces the quick_replies experiment
-- (20260923030000/20260923040000), which Instagram silently drops on the
-- standalone graph.instagram.com endpoint this app uses. Instead of native
-- buttons, a step can list options that the flow author writes into
-- message_text themselves (e.g. "1. Starter\n2. Pro\n3. Enterprise"); the
-- webhook matches the reply text against this list by number or label.
--
-- Stored as a JSON array of {label, target_step_order}; target_step_order
-- null means "end the flow" when matched. Mutually exclusive with
-- collects_email/intent_map branching on the same step (enforced in
-- app/dashboard/flows/actions.ts, not here).

alter table public.dm_flow_steps
  add column options jsonb not null default '[]'::jsonb;

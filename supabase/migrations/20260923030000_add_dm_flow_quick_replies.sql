-- Quick-reply buttons: a DM flow step can offer up to 13 tappable options
-- instead of expecting typed text. Stored as a JSON array of
-- {title, target_step_order}; target_step_order null means "end the flow"
-- when tapped. The array index (as a string) is used as Instagram's
-- quick_reply payload, so the webhook can tell exactly which button was
-- tapped rather than fuzzy-matching reply text — see
-- instagram-webhook/index.ts.
--
-- Mutually exclusive with collects_email/intent_map branching on the same
-- step (enforced in app/dashboard/flows/actions.ts, not here).

alter table public.dm_flow_steps
  add column quick_replies jsonb not null default '[]'::jsonb;

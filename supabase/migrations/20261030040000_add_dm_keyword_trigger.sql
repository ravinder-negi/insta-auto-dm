-- ============================================================
-- "Sends you a DM" trigger (trigger_type = 'dm_keyword').
--
-- A plain DM containing a keyword ("GUIDE") starts an AutoDM. Unlike a
-- comment, a DM is often part of a real conversation, so two guards keep
-- it from firing mid-chat:
--
--   keyword_exact         the whole message must be the keyword (ignoring
--                         case and surrounding punctuation/emoji), so
--                         "can you guide me?" doesn't trigger "guide".
--                         Only read for dm_keyword rules.
--   dm_repeat_after_days  how soon the same person can trigger the rule
--                         again; null means only once per person.
--
-- dm_keyword rules always use specific keywords (never "any message"),
-- have no media, and the webhook only checks them when no email ask is
-- pending and no DM flow session is active for the sender.
-- ============================================================

alter table public.automation_rules
  add column keyword_exact boolean not null default false,
  add column dm_repeat_after_days int
    check (dm_repeat_after_days is null or dm_repeat_after_days between 1 and 365);

-- The repeat guard looks up a person's last execution of a rule.
create index idx_executions_rule_commenter
  on public.automation_executions(automation_rule_id, commenter_instagram_id, created_at desc);

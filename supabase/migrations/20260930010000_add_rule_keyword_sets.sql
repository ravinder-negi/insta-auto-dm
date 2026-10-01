-- ============================================================
-- Keyword sets + multi auto-reply for automation_rules
--
-- keyword_match 'any' fires on every comment, so `keyword` can no
-- longer be required. The legacy singular columns stay in sync with
-- the first array entry for older readers.
-- ============================================================

alter table public.automation_rules
  add column keyword_match text not null default 'specific',
  add column keywords text[] not null default '{}',
  add column excluded_keywords text[] not null default '{}',
  add column public_reply_messages text[] not null default '{}';

alter table public.automation_rules
  alter column keyword drop not null;

alter table public.automation_rules
  add constraint automation_rules_keyword_match_check
  check (keyword_match in ('specific', 'any'));

-- A keyword-scoped rule needs at least one keyword to match on;
-- an 'any' rule keeps the array empty.
alter table public.automation_rules
  add constraint automation_rules_keywords_present_check
  check (keyword_match <> 'specific' or cardinality(keywords) > 0);

update public.automation_rules
set keywords = array[keyword]
where cardinality(keywords) = 0
  and keyword is not null
  and length(trim(keyword)) > 0;

update public.automation_rules
set public_reply_messages = array[public_reply_message]
where cardinality(public_reply_messages) = 0
  and public_reply_message is not null
  and length(trim(public_reply_message)) > 0;

create index idx_automation_rules_keywords
  on public.automation_rules using gin (keywords);

-- Multi-keyword trigger sets and multi-slot public replies for dm_flows,
-- mirroring 20260930010000_add_rule_keyword_sets.sql for automation_rules.
alter table public.dm_flows
  add column keyword_match text not null default 'specific',
  add column keywords text[] not null default '{}',
  add column excluded_keywords text[] not null default '{}',
  add column public_reply_messages text[] not null default '{}';

-- Backfill from the legacy singular columns, kept for old readers.
update public.dm_flows
  set keywords = array[trigger_keyword]
  where cardinality(keywords) = 0
    and trigger_keyword is not null
    and trigger_keyword <> '';

update public.dm_flows
  set public_reply_messages = array[public_reply_message]
  where cardinality(public_reply_messages) = 0
    and public_reply_message is not null
    and public_reply_message <> '';

-- "Any comment" flows no longer need a keyword.
alter table public.dm_flows
  alter column trigger_keyword drop not null;

alter table public.dm_flows
  add constraint dm_flows_keyword_match_check
    check (keyword_match in ('specific', 'any')),
  add constraint dm_flows_keywords_present_check
    check (keyword_match <> 'specific' or cardinality(keywords) > 0);

create index idx_dm_flows_keywords on public.dm_flows using gin (keywords);

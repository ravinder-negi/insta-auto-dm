-- automation_executions is an audit log; disconnecting an account or
-- removing a rule must not be blocked by (nor delete) execution history.
-- Both FKs had no ON DELETE clause, defaulting to NO ACTION, which
-- caused "disconnect account" to fail with a foreign key violation.

alter table public.automation_executions
  alter column instagram_account_id drop not null;

alter table public.automation_executions
  drop constraint automation_executions_instagram_account_id_fkey;

alter table public.automation_executions
  add constraint automation_executions_instagram_account_id_fkey
    foreign key (instagram_account_id)
    references public.instagram_accounts(id)
    on delete set null;

alter table public.automation_executions
  alter column automation_rule_id drop not null;

alter table public.automation_executions
  drop constraint automation_executions_automation_rule_id_fkey;

alter table public.automation_executions
  add constraint automation_executions_automation_rule_id_fkey
    foreign key (automation_rule_id)
    references public.automation_rules(id)
    on delete set null;

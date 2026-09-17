-- Optional per-rule "require follow before DM" gate.
-- When require_follow is true, a commenter who doesn't yet follow the
-- business account gets follow_prompt_message (with a profile link)
-- instead of dm_message. automation_follow_prompts tracks who's already
-- been prompted per rule, so we don't re-send the same prompt on every
-- matching comment.

alter table public.automation_rules
  add column require_follow boolean not null default false,
  add column follow_prompt_message text;

create table public.automation_follow_prompts (
  id uuid primary key default gen_random_uuid(),

  automation_rule_id uuid not null
    references public.automation_rules(id)
    on delete cascade,

  commenter_instagram_id text not null,

  prompted_at timestamptz not null default now(),
  followed_at timestamptz,

  unique (automation_rule_id, commenter_instagram_id)
);

create index idx_follow_prompts_rule
  on public.automation_follow_prompts(automation_rule_id);

alter table public.automation_follow_prompts enable row level security;

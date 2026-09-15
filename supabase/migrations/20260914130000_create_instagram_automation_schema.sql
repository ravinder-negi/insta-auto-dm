-- Instagram Auto-DM automation schema.

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- instagram_accounts
-- Access token lives here, per account, never as an env secret.
-- ============================================================
create table public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid
    references public.profiles(id)
    on delete set null,

  instagram_user_id text not null unique,
  username text,

  access_token text not null,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- automation_rules
-- instagram_media_id nullable to allow future account-wide rules.
-- ============================================================
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  name text not null,

  trigger_type text not null default 'comment_keyword',

  keyword text not null,
  instagram_media_id text,

  dm_message text not null,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_automation_rules_account
  on public.automation_rules(instagram_account_id);

create index idx_automation_rules_media
  on public.automation_rules(instagram_media_id);

create index idx_automation_rules_keyword
  on public.automation_rules(keyword);

-- case-insensitive/trimmed keyword matching
create index idx_automation_rules_keyword_normalized
  on public.automation_rules(lower(trim(keyword)));

create index idx_automation_rules_active
  on public.automation_rules(is_active);

-- ============================================================
-- webhook_events
-- Raw payload audit log. instagram_account_id is the resolved
-- instagram_accounts.id (null when the sending account isn't
-- recognized yet).
-- ============================================================
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),

  event_type text,

  instagram_account_id uuid
    references public.instagram_accounts(id)
    on delete set null,

  payload jsonb not null,

  processed boolean not null default false,
  error_message text,

  created_at timestamptz not null default now()
);

create index idx_webhook_events_account
  on public.webhook_events(instagram_account_id);

create index idx_webhook_events_created
  on public.webhook_events(created_at desc);

-- ============================================================
-- automation_executions
-- unique(instagram_comment_id) is the duplicate-DM guard.
-- ============================================================
create table public.automation_executions (
  id uuid primary key default gen_random_uuid(),

  automation_rule_id uuid not null
    references public.automation_rules(id),

  instagram_account_id uuid not null
    references public.instagram_accounts(id),

  instagram_comment_id text not null,

  commenter_instagram_id text,
  commenter_username text,

  instagram_media_id text,
  comment_text text,

  status text not null,
  dm_message text,
  instagram_message_id text,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(instagram_comment_id)
);

create index idx_executions_automation_rule
  on public.automation_executions(automation_rule_id);

create index idx_executions_account
  on public.automation_executions(instagram_account_id);

create index idx_executions_status
  on public.automation_executions(status);

create index idx_executions_created
  on public.automation_executions(created_at desc);

-- ============================================================
-- RLS
-- No policies yet: only the Edge Function's service-role client
-- (which bypasses RLS) can read/write these tables. This is what
-- keeps access_token out of reach of anon/authenticated requests.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.instagram_accounts enable row level security;
alter table public.automation_rules enable row level security;
alter table public.webhook_events enable row level security;
alter table public.automation_executions enable row level security;

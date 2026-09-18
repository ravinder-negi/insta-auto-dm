-- Tracks Meta's own rate-limit signal so the UI can warn before requests
-- start failing, instead of leaving users to guess why DMs stopped sending.
-- Every Graph API response carries an `x-app-usage` header with call_count/
-- total_cputime/total_time already expressed as a 0-100 percentage of the
-- app's current limit — there's no separate numeric cap to hardcode. Usage
-- is per Meta app (shared across every connected Instagram account using
-- it), not per account, hence a single row rather than one per account.

create table public.api_usage (
  id smallint primary key default 1,

  call_count smallint,
  total_cputime smallint,
  total_time smallint,

  updated_at timestamptz not null default now(),

  constraint api_usage_singleton check (id = 1)
);

insert into public.api_usage (id) values (1);

alter table public.api_usage enable row level security;

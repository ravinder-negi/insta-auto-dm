-- Server-side rollup for the analytics dashboard.
--
-- The page used to pull raw automation_executions rows and count them in JS,
-- which quietly under-reports: PostgREST caps responses at max_rows (1000),
-- so any account past that threshold saw wrong totals. This returns one row
-- per (day, rule, status) instead — a few hundred rows for a busy account
-- instead of tens of thousands — and the browser slices that for its range
-- and account filters without another round trip.
--
-- SECURITY INVOKER: every table below is behind RLS scoped to auth.uid(), so
-- the function sees exactly what the caller could already select itself.
-- Days are bucketed in UTC, and the UI formats the labels in UTC to match.

create or replace function public.analytics_rollup(p_days integer default 180)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select (
      date_trunc('day', now() at time zone 'utc')
      - make_interval(days => greatest(least(coalesce(p_days, 180), 365), 1) - 1)
    ) at time zone 'utc' as from_ts
  ),

  accounts as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'handle', coalesce(a.username, a.instagram_user_id)
        )
        order by a.created_at desc
      ),
      '[]'::jsonb
    ) as value
    from public.instagram_accounts a
  ),

  rules as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'name', r.name,
          'accountId', r.instagram_account_id,
          'isActive', r.is_active,
          'keywords', to_jsonb(r.keywords),
          'requiresFollow', r.require_follow,
          'collectsEmail', r.collect_email
        )
        order by r.created_at desc
      ),
      '[]'::jsonb
    ) as value
    from public.automation_rules r
  ),

  executions as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', t.day,
          'ruleId', t.rule_id,
          'accountId', t.account_id,
          'status', t.status,
          'count', t.n
        )
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        ((e.created_at at time zone 'utc')::date)::text as day,
        e.automation_rule_id as rule_id,
        e.instagram_account_id as account_id,
        e.status,
        count(*)::int as n
      from public.automation_executions e, bounds b
      where e.created_at >= b.from_ts
      group by 1, 2, 3, 4
    ) t
  ),

  -- Three capture points, one shape. Link-in-bio magnets belong to the
  -- profile rather than to any one Instagram account, so they carry a null
  -- accountId and drop out when a single account is selected.
  leads as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', t.day,
          'source', t.source,
          'ruleId', t.rule_id,
          'accountId', t.account_id,
          'count', t.n
        )
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        ((l.collected_at at time zone 'utc')::date)::text as day,
        'rule' as source,
        l.automation_rule_id as rule_id,
        l.instagram_account_id as account_id,
        count(*)::int as n
      from public.automation_rule_leads l, bounds b
      where l.collected_at >= b.from_ts
      group by 1, 2, 3, 4

      union all

      select
        ((l.collected_at at time zone 'utc')::date)::text,
        'flow',
        null::uuid,
        l.instagram_account_id,
        count(*)::int
      from public.dm_flow_leads l, bounds b
      where l.collected_at >= b.from_ts
      group by 1, 2, 3, 4

      union all

      select
        ((l.created_at at time zone 'utc')::date)::text,
        'link',
        null::uuid,
        null::uuid,
        count(*)::int
      from public.lead_magnet_leads l, bounds b
      where l.created_at >= b.from_ts
      group by 1, 2, 3, 4
    ) t
  ),

  -- A "follower gained" is a commenter who was nudged by a follow-gated rule
  -- and was found following on a later trigger (see the webhook's follow gate).
  follows as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', t.day,
          'ruleId', t.rule_id,
          'accountId', t.account_id,
          'count', t.n
        )
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        ((f.followed_at at time zone 'utc')::date)::text as day,
        f.automation_rule_id as rule_id,
        r.instagram_account_id as account_id,
        count(*)::int as n
      from public.automation_follow_prompts f
      join public.automation_rules r on r.id = f.automation_rule_id,
      bounds b
      where f.followed_at is not null
        and f.followed_at >= b.from_ts
      group by 1, 2, 3
    ) t
  )

  select jsonb_build_object(
    'accounts', (select value from accounts),
    'rules', (select value from rules),
    'executions', (select value from executions),
    'leads', (select value from leads),
    'follows', (select value from follows)
  );
$$;

revoke all on function public.analytics_rollup(integer) from public;
grant execute on function public.analytics_rollup(integer) to authenticated;

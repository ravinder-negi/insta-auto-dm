-- The link-in-bio analytics page and the DM flow analytics/executions pages
-- selected whole tables (profile_views, link_clicks, dm_flow_sessions,
-- dm_flow_steps, dm_flow_leads) and counted rows in JS. PostgREST caps a
-- select at max_rows (1000), so once a creator passed 1000 views, clicks or
-- conversations every total silently stopped growing, and the unordered
-- select meant the 7-day numbers came from an arbitrary 1000 rows.
--
-- These functions do the counting in SQL and return a single jsonb value,
-- which max_rows doesn't truncate. All are security invoker, so RLS still
-- limits every row to the caller's own data.

-- ============================================================
-- Link-in-bio: dashboard/analytics
-- ============================================================
create or replace function public.link_in_bio_rollup()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with
  me as (select auth.uid() as id),

  views as (
    select v.referrer, v.utm_source, v.created_at
    from public.profile_views v, me
    where v.profile_id = me.id
  ),

  clicks as (
    select c.target_type, c.target_id, c.created_at
    from public.link_clicks c, me
    where c.profile_id = me.id
  ),

  totals as (
    select jsonb_build_object(
      'viewsTotal', (select count(*) from views),
      'views7d', (select count(*) from views where created_at >= now() - interval '7 days'),
      'viewsPrev7d', (select count(*) from views
                      where created_at >= now() - interval '14 days'
                        and created_at < now() - interval '7 days'),
      'clicksTotal', (select count(*) from clicks),
      'clicks7d', (select count(*) from clicks where created_at >= now() - interval '7 days'),
      'clicksPrev7d', (select count(*) from clicks
                       where created_at >= now() - interval '14 days'
                         and created_at < now() - interval '7 days')
    ) as value
  ),

  clicks_by_target as (
    select coalesce(
      jsonb_agg(jsonb_build_object('targetType', t.target_type, 'targetId', t.target_id, 'count', t.n)),
      '[]'::jsonb
    ) as value
    from (
      select target_type, target_id, count(*) as n
      from clicks
      group by target_type, target_id
    ) t
  ),

  -- Same rule as the page used to apply with new URL(referrer).hostname:
  -- lowercased host, no userinfo/port, leading "www." dropped; anything that
  -- isn't an absolute URL counts as direct.
  referrer_hosts as (
    select coalesce(
      nullif(
        regexp_replace(
          lower(substring(referrer from '^[A-Za-z][A-Za-z0-9+.-]*://(?:[^/?#@]*@)?([^/?#:]+)')),
          '^www\.',
          ''
        ),
        ''
      ),
      'Direct / unknown'
    ) as host
    from views
  ),

  top_referrers as (
    select coalesce(
      jsonb_agg(jsonb_build_object('label', t.host, 'count', t.n) order by t.n desc, t.host),
      '[]'::jsonb
    ) as value
    from (
      select host, count(*) as n
      from referrer_hosts
      group by host
      order by count(*) desc, host
      limit 8
    ) t
  ),

  top_utm_sources as (
    select coalesce(
      jsonb_agg(jsonb_build_object('label', t.utm_source, 'count', t.n) order by t.n desc, t.utm_source),
      '[]'::jsonb
    ) as value
    from (
      select utm_source, count(*) as n
      from views
      where utm_source is not null and utm_source <> ''
      group by utm_source
      order by count(*) desc, utm_source
      limit 8
    ) t
  )

  select jsonb_build_object(
    'totals', (select value from totals),
    'clicksByTarget', (select value from clicks_by_target),
    'topReferrers', (select value from top_referrers),
    'topUtmSources', (select value from top_utm_sources)
  );
$$;

-- ============================================================
-- DM flows: dashboard/flows/analytics and dashboard/flows/[id]/analytics
-- Conversations and leads grouped by UTC day / flow / account (and status /
-- step for conversations), so the page can still filter by range and
-- account in the browser without ever holding raw rows. p_flow_id narrows
-- it to one flow.
-- ============================================================
create or replace function public.flow_analytics_rollup(p_flow_id uuid default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'sessions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', t.day, 'flowId', t.flow_id, 'accountId', t.instagram_account_id,
        'status', t.status, 'stepOrder', t.current_step_order, 'count', t.n
      )), '[]'::jsonb)
      from (
        select to_char(s.started_at at time zone 'utc', 'YYYY-MM-DD') as day,
               s.flow_id, s.instagram_account_id, s.status, s.current_step_order,
               count(*) as n
        from public.dm_flow_sessions s
        where p_flow_id is null or s.flow_id = p_flow_id
        group by 1, 2, 3, 4, 5
      ) t
    ),
    'leads', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', t.day, 'flowId', t.flow_id, 'accountId', t.instagram_account_id, 'count', t.n
      )), '[]'::jsonb)
      from (
        select to_char(l.collected_at at time zone 'utc', 'YYYY-MM-DD') as day,
               l.flow_id, l.instagram_account_id, count(*) as n
        from public.dm_flow_leads l
        where p_flow_id is null or l.flow_id = p_flow_id
        group by 1, 2, 3
      ) t
    ),
    'steps', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'flowId', st.flow_id, 'stepOrder', st.step_order
      ) order by st.flow_id, st.step_order), '[]'::jsonb)
      from public.dm_flow_steps st
      where p_flow_id is null or st.flow_id = p_flow_id
    )
  );
$$;

-- ============================================================
-- DM flows: dashboard/flows/executions shows "step N of M"; M is the
-- highest step_order of each flow.
-- ============================================================
create or replace function public.flow_step_counts()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_object_agg(t.flow_id, t.max_step), '{}'::jsonb)
  from (
    select flow_id, max(step_order) as max_step
    from public.dm_flow_steps
    group by flow_id
  ) t;
$$;

revoke execute on function public.link_in_bio_rollup() from public, anon;
revoke execute on function public.flow_analytics_rollup(uuid) from public, anon;
revoke execute on function public.flow_step_counts() from public, anon;
grant execute on function public.link_in_bio_rollup() to authenticated;
grant execute on function public.flow_analytics_rollup(uuid) to authenticated;
grant execute on function public.flow_step_counts() to authenticated;

-- Per-post analytics for the AutoDMs analytics page ("Top posts & reels").
--
-- Same approach as analytics_rollup: pre-aggregated (day, media, status)
-- buckets for a window, filtered by range and account in the browser.
-- security invoker, so the caller's RLS limits it to their own data.
--
-- Only executions that carry a media id count: comments on a post/reel,
-- story replies and Live comments. A lead has no media id of its own, so it
-- is credited to the media of the execution that asked that person for
-- their email under the same rule (the most recent one, if several).

create or replace function public.media_rollup(p_days integer default 180)
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

  executions as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', t.day,
          'mediaId', t.media_id,
          'accountId', t.account_id,
          'kind', t.kind,
          'status', t.status,
          'count', t.n
        )
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        ((e.created_at at time zone 'utc')::date)::text as day,
        e.instagram_media_id as media_id,
        e.instagram_account_id as account_id,
        coalesce(r.trigger_type, 'comment_keyword') as kind,
        e.status,
        count(*)::int as n
      from public.automation_executions e
      left join public.automation_rules r on r.id = e.automation_rule_id,
      bounds b
      where e.created_at >= b.from_ts
        and e.instagram_media_id is not null
      group by 1, 2, 3, 4, 5
    ) t
  ),

  leads as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', t.day,
          'mediaId', t.media_id,
          'accountId', t.account_id,
          'count', t.n
        )
      ),
      '[]'::jsonb
    ) as value
    from (
      select
        ((l.collected_at at time zone 'utc')::date)::text as day,
        source.media_id,
        l.instagram_account_id as account_id,
        count(*)::int as n
      from public.automation_rule_leads l
      cross join lateral (
        select e.instagram_media_id as media_id
        from public.automation_executions e
        where e.automation_rule_id = l.automation_rule_id
          and e.commenter_instagram_id = l.ig_sender_id
          and e.instagram_media_id is not null
        order by e.created_at desc
        limit 1
      ) source,
      bounds b
      where l.collected_at >= b.from_ts
      group by 1, 2, 3
    ) t
  )

  select jsonb_build_object(
    'executions', (select value from executions),
    'leads', (select value from leads)
  );
$$;

revoke all on function public.media_rollup(integer) from public, anon;
grant execute on function public.media_rollup(integer) to authenticated;

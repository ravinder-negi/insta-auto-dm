-- Multi-step DM flows: a comment keyword starts an ordered sequence of DMs
-- instead of a single static reply. Steps that expect a reply branch on the
-- next inbound DM (via a static yes/no/default intent bucket, matched in the
-- edge function) to another step, addressed by step_order within the flow.
--
-- Out of scope for this pass (see project notes): timeout/no-reply
-- follow-ups, buttons, media steps, per-flow custom intent buckets.

create table public.dm_flows (
  id uuid primary key default gen_random_uuid(),

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  name text not null,

  trigger_keyword text not null,
  instagram_media_id text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_dm_flows_account
  on public.dm_flows(instagram_account_id);

create index idx_dm_flows_keyword_normalized
  on public.dm_flows(lower(trim(trigger_keyword)));

create index idx_dm_flows_active
  on public.dm_flows(is_active);

-- ============================================================
-- dm_flow_steps
-- intent_map is {"yes": <step_order>, "no": <step_order>, "default": <step_order>},
-- all keys optional. A missing/absent target ends the flow (session
-- completes) rather than erroring, so partially-branched steps are valid.
-- Steps are addressed by step_order (not id) so the whole step list of a
-- flow can be replaced wholesale on edit without juggling foreign keys.
-- ============================================================
create table public.dm_flow_steps (
  id uuid primary key default gen_random_uuid(),

  flow_id uuid not null
    references public.dm_flows(id)
    on delete cascade,

  step_order int not null,
  message_text text not null,

  expects_reply boolean not null default false,
  intent_map jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  unique (flow_id, step_order)
);

create index idx_dm_flow_steps_flow
  on public.dm_flow_steps(flow_id);

-- ============================================================
-- dm_flow_sessions
-- Tracks one commenter's progress through one flow. Looked up by
-- (instagram_account_id, ig_sender_id, status='active') when an inbound
-- DM arrives, to know whether it's a flow reply. trigger_comment_id is
-- unique so a retried webhook delivery can't start the same flow twice.
-- ============================================================
create table public.dm_flow_sessions (
  id uuid primary key default gen_random_uuid(),

  flow_id uuid not null
    references public.dm_flows(id)
    on delete cascade,

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  ig_sender_id text not null,
  current_step_order int not null default 1,

  status text not null default 'active', -- active | completed

  trigger_comment_id text unique,

  started_at timestamptz not null default now(),
  last_interaction_at timestamptz not null default now()
);

create index idx_dm_flow_sessions_flow
  on public.dm_flow_sessions(flow_id);

create index idx_dm_flow_sessions_lookup
  on public.dm_flow_sessions(instagram_account_id, ig_sender_id, status);

-- ============================================================
-- RLS: same owned-through-account pattern as automation_rules.
-- dm_flow_sessions is a service-role-written log, so it's read-only here.
-- ============================================================
alter table public.dm_flows enable row level security;
alter table public.dm_flow_steps enable row level security;
alter table public.dm_flow_sessions enable row level security;

create policy "dm_flows_select_own"
  on public.dm_flows for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "dm_flows_insert_own"
  on public.dm_flows for insert
  to authenticated
  with check (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "dm_flows_update_own"
  on public.dm_flows for update
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  )
  with check (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "dm_flows_delete_own"
  on public.dm_flows for delete
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "dm_flow_steps_select_own"
  on public.dm_flow_steps for select
  to authenticated
  using (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "dm_flow_steps_insert_own"
  on public.dm_flow_steps for insert
  to authenticated
  with check (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "dm_flow_steps_update_own"
  on public.dm_flow_steps for update
  to authenticated
  using (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  )
  with check (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "dm_flow_steps_delete_own"
  on public.dm_flow_steps for delete
  to authenticated
  using (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "dm_flow_sessions_select_own"
  on public.dm_flow_sessions for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

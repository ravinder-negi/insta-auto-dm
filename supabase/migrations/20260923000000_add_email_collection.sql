-- Email collection: a DM flow step can mark its expected reply as an email
-- address instead of a yes/no branch. On a valid email, it's upserted into
-- dm_flow_leads (keyed by (flow_id, ig_sender_id), so a repeat run of the
-- same flow just updates the stored email) and the session advances via
-- intent_map.yes (reusing the existing intent_map column rather than adding
-- a parallel target column). On an invalid reply, the session stays on the
-- same step and is re-prompted — see instagram-webhook/index.ts.

alter table public.dm_flow_steps
  add column collects_email boolean not null default false;

create table public.dm_flow_leads (
  id uuid primary key default gen_random_uuid(),

  flow_id uuid not null
    references public.dm_flows(id)
    on delete cascade,

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  ig_sender_id text not null,
  email text not null,

  collected_at timestamptz not null default now(),

  unique (flow_id, ig_sender_id)
);

create index idx_dm_flow_leads_flow
  on public.dm_flow_leads(flow_id);

alter table public.dm_flow_leads enable row level security;

create policy "dm_flow_leads_select_own"
  on public.dm_flow_leads for select
  to authenticated
  using (
    flow_id in (
      select id from public.dm_flows where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

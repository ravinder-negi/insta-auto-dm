-- ============================================================
-- Delayed sends, pre-DM email ask, DM buttons and follow-ups
-- for automation_rules.
--
-- Anything that isn't sent during the webhook request itself goes
-- through scheduled_dms, swept by pg_cron/pg_net the same way
-- send_dm_flow_followups() already works.
-- ============================================================

alter table public.automation_rules
  add column send_delay_seconds int not null default 0,
  add column collect_email boolean not null default false,
  add column email_prompt_message text,
  -- [{ "label": "...", "url": "https://..." }], max 3, enforced in the app.
  add column dm_buttons jsonb not null default '[]'::jsonb;

alter table public.automation_rules
  add constraint automation_rules_send_delay_check
  check (send_delay_seconds >= 0 and send_delay_seconds <= 86400);

-- ============================================================
-- FOLLOW-UP MESSAGES
-- Sent a while after the primary DM, in step_order.
-- ============================================================

create table public.automation_rule_followups (
  id uuid primary key default gen_random_uuid(),

  automation_rule_id uuid not null
    references public.automation_rules(id)
    on delete cascade,

  step_order int not null,
  delay_minutes int not null check (delay_minutes > 0 and delay_minutes <= 10080),
  message text not null,

  created_at timestamptz not null default now(),

  unique (automation_rule_id, step_order)
);

create index idx_rule_followups_rule
  on public.automation_rule_followups(automation_rule_id);

alter table public.automation_rule_followups enable row level security;

create policy "rule_followups_select_own"
  on public.automation_rule_followups for select
  to authenticated
  using (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "rule_followups_insert_own"
  on public.automation_rule_followups for insert
  to authenticated
  with check (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "rule_followups_update_own"
  on public.automation_rule_followups for update
  to authenticated
  using (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  )
  with check (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

create policy "rule_followups_delete_own"
  on public.automation_rule_followups for delete
  to authenticated
  using (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

-- ============================================================
-- EMAIL ASK
-- automation_email_prompts tracks who has been asked and is still
-- owing an address; the reply is upserted into automation_rule_leads
-- and the primary DM goes out right after.
-- ============================================================

create table public.automation_email_prompts (
  id uuid primary key default gen_random_uuid(),

  automation_rule_id uuid not null
    references public.automation_rules(id)
    on delete cascade,

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  ig_sender_id text not null,
  instagram_comment_id text,

  status text not null default 'pending'
    check (status in ('pending', 'collected')),

  prompted_at timestamptz not null default now(),
  collected_at timestamptz,

  unique (automation_rule_id, ig_sender_id)
);

create index idx_email_prompts_pending
  on public.automation_email_prompts(instagram_account_id, ig_sender_id)
  where status = 'pending';

alter table public.automation_email_prompts enable row level security;

create policy "email_prompts_select_own"
  on public.automation_email_prompts for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create table public.automation_rule_leads (
  id uuid primary key default gen_random_uuid(),

  automation_rule_id uuid not null
    references public.automation_rules(id)
    on delete cascade,

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  ig_sender_id text not null,
  email text not null,

  collected_at timestamptz not null default now(),

  unique (automation_rule_id, ig_sender_id)
);

create index idx_rule_leads_rule
  on public.automation_rule_leads(automation_rule_id);

alter table public.automation_rule_leads enable row level security;

create policy "rule_leads_select_own"
  on public.automation_rule_leads for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

-- ============================================================
-- SCHEDULED DM OUTBOX
-- Delayed primary DMs and follow-ups land here. recipient_comment_id
-- is kept when the send is a private reply to a comment, since that
-- addressing mode is what Instagram allows outside the 24h window.
-- ============================================================

create table public.scheduled_dms (
  id uuid primary key default gen_random_uuid(),

  instagram_account_id uuid not null
    references public.instagram_accounts(id)
    on delete cascade,

  automation_rule_id uuid
    references public.automation_rules(id)
    on delete cascade,

  recipient_ig_id text not null,
  recipient_comment_id text,

  message text not null,
  send_after timestamptz not null,

  status text not null default 'pending'
    check (status in ('pending', 'sent', 'canceled')),

  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_scheduled_dms_due
  on public.scheduled_dms(send_after)
  where status = 'pending';

alter table public.scheduled_dms enable row level security;

create policy "scheduled_dms_select_own"
  on public.scheduled_dms for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

-- security definer: the sweep runs on a schedule, not as any particular
-- authenticated user — same reasoning as send_dm_flow_followups().
create or replace function public.send_scheduled_dms()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  due record;
begin
  for due in
    select
      d.id,
      d.recipient_ig_id,
      d.recipient_comment_id,
      d.message,
      ia.instagram_user_id,
      ia.access_token
    from public.scheduled_dms d
    join public.instagram_accounts ia
      on ia.id = d.instagram_account_id
    where d.status = 'pending'
      and d.send_after <= now()
      and ia.is_active = true
    order by d.send_after
    limit 200
  loop
    -- Fire-and-forget, like the DM flow sweep: pg_net queues the request
    -- and records the response in net._http_response. A failed send isn't
    -- retried, matching the webhook's own best-effort sends.
    perform net.http_post(
      url := format(
        'https://graph.instagram.com/v26.0/%s/messages',
        due.instagram_user_id
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || due.access_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'recipient',
        case
          when due.recipient_comment_id is not null
            then jsonb_build_object('comment_id', due.recipient_comment_id)
          else jsonb_build_object('id', due.recipient_ig_id)
        end,
        'message', jsonb_build_object('text', due.message)
      )
    );

    update public.scheduled_dms
      set status = 'sent', sent_at = now()
      where id = due.id;
  end loop;
end;
$$;

-- Sub-minute cadence so a "30 second" delay still feels immediate.
select cron.schedule(
  'scheduled-dms',
  '30 seconds',
  $$select public.send_scheduled_dms();$$
);

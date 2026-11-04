-- Meta redelivers webhook events (retries after a slow or failed response),
-- and can deliver the same event concurrently. Inbound DMs that answer an
-- email ask or advance a dm_flow session had no dedupe, so a redelivery
-- could advance a flow twice or send "Sorry, didn't catch that" again.
--
-- The webhook claims each inbound message id (mid) here before acting on
-- it; a second delivery of the same mid hits the primary key and is
-- skipped. Written only by the instagram-webhook edge function (service
-- role): RLS on, no policies.

create table public.processed_inbound_messages (
  mid text primary key,
  instagram_account_id uuid references public.instagram_accounts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_processed_inbound_messages_created_at
  on public.processed_inbound_messages (created_at);

alter table public.processed_inbound_messages enable row level security;

revoke all on table public.processed_inbound_messages from anon, authenticated;

-- Redeliveries arrive within minutes to hours; a week is plenty.
-- 04:43 UTC daily: off the hour, away from the token refresh at 03:17.
select cron.schedule(
  'prune-processed-inbound-messages',
  '43 4 * * *',
  $$delete from public.processed_inbound_messages where created_at < now() - interval '7 days';$$
);

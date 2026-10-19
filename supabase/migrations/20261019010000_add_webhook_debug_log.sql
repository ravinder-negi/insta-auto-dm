-- Temporary capture table: logs any inbound DM attachment whose type doesn't
-- match a known kind (share/ig_post/ig_reel), so we can see exactly what
-- Meta sends for cases we haven't identified yet (e.g. an image-post share).
-- Safe to drop once post_share attachment-type handling is confirmed complete.
create table if not exists public.webhook_debug_events (
  id uuid primary key default gen_random_uuid(),
  instagram_account_id uuid references public.instagram_accounts(id) on delete set null,
  raw_message jsonb not null,
  created_at timestamptz not null default now()
);

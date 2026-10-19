-- Temporary capture table used to diagnose the post_share attachment-type
-- mismatch (see 20261019010000) — no longer needed now that matching uses
-- the real media id Meta sends.
drop table if exists public.webhook_debug_events;

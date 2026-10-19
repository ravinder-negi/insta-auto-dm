-- A post_share rule can be scoped to one post/reel, but the DM "share"
-- attachment only carries the post's permalink (not its Graph media id), so
-- matching uses the permalink's shortcode instead of instagram_media_id.
-- Null means account-wide, same convention as instagram_media_id.
alter table public.automation_rules
  add column if not exists instagram_media_shortcode text;

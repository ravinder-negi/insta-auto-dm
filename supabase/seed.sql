-- Test data for local dev / manual webhook testing.
--
-- Do NOT commit a real Instagram access token, App Secret, or verify
-- token here. Paste real values directly in the Supabase SQL Editor
-- instead of editing this file.

insert into public.instagram_accounts (
  instagram_user_id,
  username,
  access_token,
  is_active
)
values (
  'YOUR_REAL_INSTAGRAM_USER_ID',
  'YOUR_INSTAGRAM_USERNAME',
  'PASTE_TOKEN_DIRECTLY_IN_SUPABASE_SQL_EDITOR',
  true
);

-- instagram_media_id must be a real Instagram post/reel ID before
-- testing against a real webhook event.
insert into public.automation_rules (
  instagram_account_id,
  name,
  trigger_type,
  keyword,
  instagram_media_id,
  dm_message
)
values (
  (select id from public.instagram_accounts where instagram_user_id = 'YOUR_REAL_INSTAGRAM_USER_ID'),
  'Guide Comment Automation',
  'comment_keyword',
  'GUIDE',
  '123123123',
  'Here is your guide!'
);

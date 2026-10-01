-- Analytics reads for the follow gate.
--
-- automation_follow_prompts shipped with RLS on and no policies, because only
-- the Edge Function (service role) touched it. The analytics page now reports
-- "followers gained" from it — commenters who were nudged to follow and later
-- passed the follow check — so the owner needs a select policy, and the
-- webhook needs to actually stamp followed_at (it never did).

create policy "follow_prompts_select_own"
  on public.automation_follow_prompts for select
  to authenticated
  using (
    automation_rule_id in (
      select id from public.automation_rules where instagram_account_id in (
        select id from public.instagram_accounts where profile_id = auth.uid()
      )
    )
  );

-- Partial: the analytics query only ever counts the converted rows.
create index idx_follow_prompts_followed
  on public.automation_follow_prompts(followed_at)
  where followed_at is not null;

create index idx_follow_prompts_prompted
  on public.automation_follow_prompts(prompted_at desc);

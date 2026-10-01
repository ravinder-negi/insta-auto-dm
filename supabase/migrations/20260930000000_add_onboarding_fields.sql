-- Post-signup onboarding: the answers collected on the way to the dashboard.
--
-- The *gate* (which step a user still owes) lives in auth.users
-- raw_user_meta_data.onboarding_step so `proxy.ts` can read it off the session
-- user without a database round trip on every request. These columns are the
-- durable copy of the same state plus the answers themselves; both are written
-- together by src/features/onboarding/actions.ts.
--
-- Nullable with no default on purpose: rows that predate onboarding stay null
-- and are treated as "nothing owed", exactly like their auth metadata.

alter table public.profiles
  add column content_niche text,
  add column primary_goal text,
  add column onboarding_step text,
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step in ('content', 'goal', 'connect', 'done'));

-- Seed display_name (as before) and the onboarding step that signUp() stored in
-- the user's metadata, so a fresh profile starts the flow already marked.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, onboarding_step)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'onboarding_step'
  );
  return new;
end;
$$;

-- Auto-create a profile row for every new auth user, and let signed-in
-- users manage their own data through RLS (the edge function keeps using
-- the service-role key, which bypasses RLS entirely).

-- ============================================================
-- profiles: auto-create on signup
-- ============================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- profiles: read/update own row
-- ============================================================
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- instagram_accounts: full CRUD on own rows
-- ============================================================
create policy "instagram_accounts_select_own"
  on public.instagram_accounts for select
  to authenticated
  using (profile_id = auth.uid());

create policy "instagram_accounts_insert_own"
  on public.instagram_accounts for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "instagram_accounts_update_own"
  on public.instagram_accounts for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "instagram_accounts_delete_own"
  on public.instagram_accounts for delete
  to authenticated
  using (profile_id = auth.uid());

-- ============================================================
-- automation_rules: full CRUD, scoped through owned accounts
-- ============================================================
create policy "automation_rules_select_own"
  on public.automation_rules for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "automation_rules_insert_own"
  on public.automation_rules for insert
  to authenticated
  with check (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

create policy "automation_rules_update_own"
  on public.automation_rules for update
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

create policy "automation_rules_delete_own"
  on public.automation_rules for delete
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

-- ============================================================
-- automation_executions: read-only log, scoped through owned accounts
-- ============================================================
create policy "automation_executions_select_own"
  on public.automation_executions for select
  to authenticated
  using (
    instagram_account_id in (
      select id from public.instagram_accounts where profile_id = auth.uid()
    )
  );

-- webhook_events intentionally has no policies: raw payload audit log,
-- service-role (the edge function) only.

-- Admin allowlist + app-wide appearance settings. Neither table is writable
-- from the app: admin_users has no insert/update/delete policy at all (grant
-- access via the SQL editor: `insert into public.admin_users (id) select id
-- from auth.users where email = '...'`), and app_settings can only be
-- updated by a signed-in user whose id is already in admin_users.

-- ============================================================
-- admin_users: allowlist, checked via auth.uid()
-- ============================================================
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "admin_users_select_own"
  on public.admin_users for select
  to authenticated
  using (id = auth.uid());

-- ============================================================
-- app_settings: single row (id = 1), public read, admin-only write
-- ============================================================
create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  accent_color text not null default '#6d5ef6',
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

insert into public.app_settings (id) values (1);

create policy "app_settings_select_all"
  on public.app_settings for select
  using (true);

create policy "app_settings_update_admin"
  on public.app_settings for update
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

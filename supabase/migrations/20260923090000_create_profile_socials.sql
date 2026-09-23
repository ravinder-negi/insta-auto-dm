-- Link-in-bio: profile_socials, one row per connected platform per profile.

create table public.profile_socials (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  platform text not null
    check (platform in ('instagram', 'youtube', 'facebook', 'x', 'tiktok')),
  url text not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (profile_id, platform)
);

create index idx_profile_socials_profile_id on public.profile_socials (profile_id);

alter table public.profile_socials enable row level security;

-- ============================================================
-- owner: full CRUD on own social accounts
-- ============================================================
create policy "profile_socials_select_own"
  on public.profile_socials for select
  to authenticated
  using (profile_id = auth.uid());

create policy "profile_socials_insert_own"
  on public.profile_socials for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "profile_socials_update_own"
  on public.profile_socials for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "profile_socials_delete_own"
  on public.profile_socials for delete
  to authenticated
  using (profile_id = auth.uid());

-- ============================================================
-- public: active socials on published profiles (app/[username])
-- ============================================================
create policy "profile_socials_select_public"
  on public.profile_socials for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = profile_socials.profile_id
      and profiles.is_published = true
    )
  );

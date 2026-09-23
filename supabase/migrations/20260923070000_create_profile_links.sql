-- Link-in-bio: profile_links, an ordered list of URLs owned by a profile.

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,
  url text not null,
  link_type text not null default 'custom'
    check (link_type in ('website', 'youtube', 'blog', 'product', 'custom')),
  position integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profile_links_profile_id on public.profile_links (profile_id);
create index idx_profile_links_profile_position on public.profile_links (profile_id, position);

alter table public.profile_links enable row level security;

-- ============================================================
-- owner: full CRUD on own links
-- ============================================================
create policy "profile_links_select_own"
  on public.profile_links for select
  to authenticated
  using (profile_id = auth.uid());

create policy "profile_links_insert_own"
  on public.profile_links for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "profile_links_update_own"
  on public.profile_links for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "profile_links_delete_own"
  on public.profile_links for delete
  to authenticated
  using (profile_id = auth.uid());

-- ============================================================
-- public: active links on published profiles (app/[username])
-- ============================================================
create policy "profile_links_select_public"
  on public.profile_links for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = profile_links.profile_id
      and profiles.is_published = true
    )
  );

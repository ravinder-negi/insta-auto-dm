-- Link-in-bio: lead magnets (free downloadable resources) and the visitor
-- emails captured in exchange for them.

create table public.lead_magnets (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,
  description text,
  file_url text not null,
  file_name text,
  position integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lead_magnets_profile_id on public.lead_magnets (profile_id);
create index idx_lead_magnets_profile_position on public.lead_magnets (profile_id, position);

alter table public.lead_magnets enable row level security;

create policy "lead_magnets_select_own"
  on public.lead_magnets for select
  to authenticated
  using (profile_id = auth.uid());

create policy "lead_magnets_insert_own"
  on public.lead_magnets for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "lead_magnets_update_own"
  on public.lead_magnets for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "lead_magnets_delete_own"
  on public.lead_magnets for delete
  to authenticated
  using (profile_id = auth.uid());

-- public: active lead magnets on published profiles (app/[username])
create policy "lead_magnets_select_public"
  on public.lead_magnets for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = lead_magnets.profile_id
      and profiles.is_published = true
    )
  );

-- ============================================================
-- lead_magnet_leads: visitor emails captured for a lead magnet
-- ============================================================
create table public.lead_magnet_leads (
  id uuid primary key default gen_random_uuid(),

  lead_magnet_id uuid not null
    references public.lead_magnets(id)
    on delete cascade,

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  email text not null,

  created_at timestamptz not null default now(),

  unique (lead_magnet_id, email)
);

create index idx_lead_magnet_leads_profile_id on public.lead_magnet_leads (profile_id);
create index idx_lead_magnet_leads_magnet_id on public.lead_magnet_leads (lead_magnet_id);

alter table public.lead_magnet_leads enable row level security;

-- owner: read and manage the emails captured for their own lead magnets
create policy "lead_magnet_leads_select_own"
  on public.lead_magnet_leads for select
  to authenticated
  using (profile_id = auth.uid());

create policy "lead_magnet_leads_delete_own"
  on public.lead_magnet_leads for delete
  to authenticated
  using (profile_id = auth.uid());

-- public: anyone can submit an email for an active magnet on a published
-- profile — this is the visitor-facing capture on app/[username].
create policy "lead_magnet_leads_insert_public"
  on public.lead_magnet_leads for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.lead_magnets lm
      join public.profiles p on p.id = lm.profile_id
      where lm.id = lead_magnet_leads.lead_magnet_id
      and lm.profile_id = lead_magnet_leads.profile_id
      and lm.is_active = true
      and p.is_published = true
    )
  );

-- ============================================================
-- lead-magnets: public bucket, owner-scoped writes (path prefixed by profile id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lead-magnets', 'lead-magnets', true)
on conflict (id) do nothing;

create policy "lead_magnets_files_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'lead-magnets');

create policy "lead_magnets_files_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lead-magnets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "lead_magnets_files_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lead-magnets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'lead-magnets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "lead_magnets_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lead-magnets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Link-in-bio analytics: page views on the public profile, and clicks on
-- the clickable things it renders (profile links, lead magnets, products,
-- socials). Nothing tracked this before — owners had zero visibility into
-- what visitors actually did on their page.

create table public.profile_views (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,

  created_at timestamptz not null default now()
);

create index idx_profile_views_profile_id on public.profile_views (profile_id);
create index idx_profile_views_profile_created on public.profile_views (profile_id, created_at desc);

alter table public.profile_views enable row level security;

create policy "profile_views_select_own"
  on public.profile_views for select
  to authenticated
  using (profile_id = auth.uid());

-- public: anyone can log a view of a published profile (app/[username]).
create policy "profile_views_insert_public"
  on public.profile_views for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_views.profile_id
      and p.is_published = true
    )
  );

-- ============================================================
-- link_clicks: polymorphic — one row per click on any clickable element
-- ============================================================
create table public.link_clicks (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  target_type text not null
    check (target_type in ('profile_link', 'lead_magnet', 'product', 'social')),
  target_id uuid not null,

  referrer text,

  created_at timestamptz not null default now()
);

create index idx_link_clicks_profile_id on public.link_clicks (profile_id);
create index idx_link_clicks_target on public.link_clicks (target_type, target_id);
create index idx_link_clicks_profile_created on public.link_clicks (profile_id, created_at desc);

alter table public.link_clicks enable row level security;

create policy "link_clicks_select_own"
  on public.link_clicks for select
  to authenticated
  using (profile_id = auth.uid());

-- public: anyone can log a click against an active target on a published
-- profile — target_id is checked against the table that target_type names,
-- same shape as lead_magnet_leads_insert_public.
create policy "link_clicks_insert_public"
  on public.link_clicks for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = link_clicks.profile_id
      and p.is_published = true
    )
    and (
      (
        target_type = 'profile_link'
        and exists (
          select 1 from public.profile_links l
          where l.id = link_clicks.target_id
          and l.profile_id = link_clicks.profile_id
          and l.is_active = true
        )
      )
      or (
        target_type = 'lead_magnet'
        and exists (
          select 1 from public.lead_magnets m
          where m.id = link_clicks.target_id
          and m.profile_id = link_clicks.profile_id
          and m.is_active = true
        )
      )
      or (
        target_type = 'product'
        and exists (
          select 1 from public.products pr
          where pr.id = link_clicks.target_id
          and pr.profile_id = link_clicks.profile_id
          and pr.is_active = true
        )
      )
      or (
        target_type = 'social'
        and exists (
          select 1 from public.profile_socials s
          where s.id = link_clicks.target_id
          and s.profile_id = link_clicks.profile_id
          and s.is_active = true
        )
      )
    )
  );

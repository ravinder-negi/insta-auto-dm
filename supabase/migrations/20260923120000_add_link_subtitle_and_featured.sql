-- Link-in-bio: an optional one-line subtitle shown under a link's title on
-- the public page, and a "featured" flag for visual emphasis.

alter table public.profile_links
  add column subtitle text,
  add column is_featured boolean not null default false;

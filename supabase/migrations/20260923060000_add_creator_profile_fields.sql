-- Link-in-bio: creator profile fields on the existing 1:1 profiles table,
-- plus public read access for published profiles and an avatars bucket.

-- ============================================================
-- profiles: creator profile fields
-- ============================================================
alter table public.profiles
  add column username text,
  add column display_name text,
  add column bio text,
  add column avatar_url text,
  add column brand_color text,
  add column is_published boolean not null default false;

create unique index profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

-- ============================================================
-- profiles: public read for published creator pages (app/[username])
-- Existing profiles_select_own (authenticated, own row) still applies
-- and is OR'd with this — an owner previewing an unpublished profile
-- keeps seeing their own row.
-- ============================================================
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (is_published = true and username is not null);

-- ============================================================
-- avatars: public bucket, owner-scoped writes (path prefixed by user id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Link-in-bio: decouple a link's display icon from its link_type, and let
-- creators upload a custom icon image.

alter table public.profile_links
  add column icon text
    check (icon in ('link', 'youtube', 'instagram', 'globe', 'mail', 'custom')),
  add column custom_icon_url text;

-- ============================================================
-- link-icons: public bucket, owner-scoped writes (path prefixed by profile id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('link-icons', 'link-icons', true)
on conflict (id) do nothing;

create policy "link_icons_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'link-icons');

create policy "link_icons_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'link-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "link_icons_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'link-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'link-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "link_icons_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'link-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

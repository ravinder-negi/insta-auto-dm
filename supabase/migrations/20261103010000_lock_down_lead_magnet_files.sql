-- The lead-magnet email gate could be skipped: lead_magnets_select_public let
-- anon (and any signed-in user) read every column of active magnets on
-- published profiles, file_url included, and the lead-magnets bucket was
-- public, so the download needed no email at all.
--
-- file_url is now readable by nobody but the service role. The row policies
-- are unchanged (link_clicks_insert_public and lead_magnet_leads_insert_public
-- still look magnets up by id/profile_id/is_active). The app hands file_url
-- out only after an email is submitted, as a short-lived signed URL
-- (src/app/(public)/[username]/actions.ts), and owners read it server-side.
--
-- Files keep their stored public-style URL; the app turns it into a signed
-- URL. Direct links to /storage/v1/object/public/lead-magnets/... stop
-- working once the bucket is private.

revoke select on table public.lead_magnets from anon, authenticated;

grant select (
  id,
  profile_id,
  title,
  description,
  file_name,
  position,
  is_active,
  created_at,
  updated_at
) on table public.lead_magnets to anon, authenticated;

update storage.buckets set public = false where id = 'lead-magnets';

drop policy if exists "lead_magnets_files_read_public" on storage.objects;

-- Owners can still read their own files (upload with upsert needs select).
create policy "lead_magnets_files_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lead-magnets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

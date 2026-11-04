-- Uploads were only checked in the browser (the file input's accept list and
-- a size check before upload). Anyone calling the Storage API directly with
-- their session could upload any size and any type — including SVG (script
-- capable) or HTML — into these public buckets.
--
-- The buckets now enforce the same limits the app shows
-- (src/lib/storage/uploadRules.ts). Existing files are untouched; this only
-- applies to new uploads.

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id in ('avatars', 'product-images');

-- Link icons were capped at 2MB in the app, and no longer accept SVG.
update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'link-icons';

update storage.buckets
set file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = array[
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/epub+zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
where id = 'lead-magnets';

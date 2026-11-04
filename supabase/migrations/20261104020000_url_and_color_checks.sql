-- URL and colour fields shown on the public profile were only validated in
-- server actions (and avatar/product image/link icon URLs and brand colour
-- not at all). Owners can also write these rows directly through PostgREST,
-- so a javascript:/data: URL or a CSS-injecting "colour" could reach the
-- public page. These checks hold the same rules as src/lib/validation/fields.ts
-- in the database.
--
-- Existing data was checked against every rule before this migration.

-- Same rule as normalizeHexColor(): a three-digit colour becomes six digits.
update public.profiles
set brand_color = regexp_replace(lower(brand_color), '^#(.)(.)(.)$', '#\1\1\2\2\3\3')
where brand_color ~* '^#[0-9a-f]{3}$';

alter table public.profiles
  add constraint profiles_avatar_url_http
    check (avatar_url is null or (avatar_url ~* '^https?://[^[:space:]]+$' and char_length(avatar_url) <= 2048)),
  add constraint profiles_brand_color_hex
    check (brand_color is null or brand_color ~* '^#[0-9a-f]{6}$');

alter table public.products
  add constraint products_image_url_http
    check (image_url is null or (image_url ~* '^https?://[^[:space:]]+$' and char_length(image_url) <= 2048)),
  add constraint products_product_url_http
    check (product_url is null or (product_url ~* '^https?://[^[:space:]]+$' and char_length(product_url) <= 2048));

alter table public.profile_links
  add constraint profile_links_url_http
    check (url ~* '^https?://[^[:space:]]+$' and char_length(url) <= 2048),
  add constraint profile_links_custom_icon_url_http
    check (custom_icon_url is null or (custom_icon_url ~* '^https?://[^[:space:]]+$' and char_length(custom_icon_url) <= 2048));

alter table public.lead_magnets
  add constraint lead_magnets_file_url_http
    check (file_url ~* '^https?://[^[:space:]]+$' and char_length(file_url) <= 2048);

-- The Email platform stores a mailto: link.
alter table public.profile_socials
  add constraint profile_socials_url_safe
    check (url is null or (url ~* '^(https?://|mailto:)[^[:space:]]+$' and char_length(url) <= 2048));

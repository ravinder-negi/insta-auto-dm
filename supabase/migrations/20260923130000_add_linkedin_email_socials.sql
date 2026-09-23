-- Link-in-bio: LinkedIn and email round out the social row on the public page.
-- `email` holds a mailto: URL rather than an https one.

alter table public.profile_socials
  drop constraint profile_socials_platform_check;

alter table public.profile_socials
  add constraint profile_socials_platform_check
  check (platform in ('instagram', 'youtube', 'facebook', 'x', 'tiktok', 'linkedin', 'email'));

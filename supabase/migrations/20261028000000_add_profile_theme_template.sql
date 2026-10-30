-- Link-in-bio: selectable public profile layout, independent of the
-- existing font/button/alignment theme fields.

alter table public.profiles
  add column theme_template text not null default 'original'
    check (theme_template in ('original', 'centered', 'noir'));

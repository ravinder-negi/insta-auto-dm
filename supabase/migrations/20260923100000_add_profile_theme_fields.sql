-- Link-in-bio: theme customization for the public profile page.

alter table public.profiles
  add column theme_font text not null default 'sans'
    check (theme_font in ('sans', 'serif', 'mono')),
  add column theme_button_style text not null default 'rounded'
    check (theme_button_style in ('pill', 'rounded', 'square')),
  add column theme_layout text not null default 'center'
    check (theme_layout in ('center', 'left'));

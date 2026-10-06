-- Public contact form (marketing site /contact): visitor email + message,
-- no account required. Insert-only from the client; nothing reads it back
-- except via the Supabase dashboard (service role).

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  email text not null,
  phone text not null,
  message text not null,

  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_public"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

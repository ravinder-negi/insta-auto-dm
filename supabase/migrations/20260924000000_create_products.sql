-- Link-in-bio, Phase 2: products are catalog cards only — display + an
-- optional external `product_url` (e.g. a Gumroad or storefront link).
-- No payment processing, orders, or checkout belong in this table; `price`
-- and `currency` are informational display fields. Phase 3 can add payment
-- fields (`product_type`, `stripe_price_id`, an `orders` table, etc.)
-- without touching this shape.

create table public.products (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  name text not null,
  description text,
  image_url text,
  product_url text,
  price numeric(10, 2) check (price is null or price >= 0),
  currency text not null default 'USD',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  position integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_profile_id on public.products (profile_id);
create index idx_products_profile_position on public.products (profile_id, position);

alter table public.products enable row level security;

-- ============================================================
-- owner: full CRUD on own products
-- ============================================================
create policy "products_select_own"
  on public.products for select
  to authenticated
  using (profile_id = auth.uid());

create policy "products_insert_own"
  on public.products for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "products_update_own"
  on public.products for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "products_delete_own"
  on public.products for delete
  to authenticated
  using (profile_id = auth.uid());

-- ============================================================
-- public: active products on published profiles (app/[username])
-- ============================================================
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.profiles
      where profiles.id = products.profile_id
      and profiles.is_published = true
    )
  );

-- ============================================================
-- product-images: public bucket, owner-scoped writes (path prefixed by profile id)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "product_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

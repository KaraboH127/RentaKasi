-- RentaKasi Supabase schema
-- Run this in the Supabase SQL Editor for project iubuhqgfipcrgkzqukhl.

create extension if not exists pgcrypto;

-- Public user profile data. Account role is stored in auth.users.raw_user_meta_data.role.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  location text not null,
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_available_created_at_idx on public.listings(available, created_at desc);
create index if not exists listing_images_listing_id_idx on public.listing_images(listing_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

-- Profiles: readable by everyone, editable only by owner.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Listings: public read, owner-only writes.
drop policy if exists "Listings are publicly readable" on public.listings;
create policy "Listings are publicly readable"
on public.listings for select
using (true);

drop policy if exists "Users can create own listings" on public.listings;
create policy "Users can create own listings"
on public.listings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings"
on public.listings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings"
on public.listings for delete
to authenticated
using (auth.uid() = user_id);

-- Listing images inherit ownership from their listing.
drop policy if exists "Listing images are publicly readable" on public.listing_images;
create policy "Listing images are publicly readable"
on public.listing_images for select
using (true);

drop policy if exists "Users can add images to own listings" on public.listing_images;
create policy "Users can add images to own listings"
on public.listing_images for insert
to authenticated
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists "Users can update images on own listings" on public.listing_images;
create policy "Users can update images on own listings"
on public.listing_images for update
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete images on own listings" on public.listing_images;
create policy "Users can delete images on own listings"
on public.listing_images for delete
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

-- Supabase Storage bucket and policies.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images bucket is publicly readable" on storage.objects;
create policy "Listing images bucket is publicly readable"
on storage.objects for select
using (bucket_id = 'listing-images');

drop policy if exists "Authenticated users can upload listing images" on storage.objects;
create policy "Authenticated users can upload listing images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-images');

drop policy if exists "Users can update images in their folder" on storage.objects;
create policy "Users can update images in their folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete images in their folder" on storage.objects;
create policy "Users can delete images in their folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

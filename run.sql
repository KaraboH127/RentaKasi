-- RentaKasi production setup script
-- Safe to run in the Supabase SQL editor. This extends the existing foundation
-- with tenant notifications, saved searches, map/location metadata, trust reports,
-- verification records, and listing expiry automation.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists verified_landlord boolean not null default false,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists landlord_verified_at timestamptz;

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles
  add constraint profiles_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')) not valid;

alter table public.profiles validate constraint profiles_verification_status_check;

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

alter table public.listings
  add column if not exists address text,
  add column if not exists landmark text,
  add column if not exists taxi_route_proximity text,
  add column if not exists transport_info text,
  add column if not exists latitude numeric(10, 6),
  add column if not exists longitude numeric(10, 6),
  add column if not exists room_type text,
  add column if not exists outside_photo_url text,
  add column if not exists street_photo_url text,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists last_verified_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists refreshed_at timestamptz not null default now();

alter table public.listings drop constraint if exists listings_room_type_check;
alter table public.listings drop constraint if exists listings_verification_status_check;
alter table public.listings drop constraint if exists listings_latitude_check;
alter table public.listings drop constraint if exists listings_longitude_check;
alter table public.listings
  add constraint listings_room_type_check
    check (room_type is null or room_type in ('room', 'back_room', 'cottage', 'apartment', 'shared')) not valid,
  add constraint listings_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')) not valid,
  add constraint listings_latitude_check
    check (latitude is null or (latitude >= -90 and latitude <= 90)) not valid,
  add constraint listings_longitude_check
    check (longitude is null or (longitude >= -180 and longitude <= 180)) not valid;

alter table public.listings validate constraint listings_room_type_check;
alter table public.listings validate constraint listings_verification_status_check;
alter table public.listings validate constraint listings_latitude_check;
alter table public.listings validate constraint listings_longitude_check;

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  areas text[] not null default '{}',
  min_price numeric(10, 2),
  max_price numeric(10, 2),
  room_types text[] not null default '{}',
  keywords text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_searches_price_range_check check (
    (min_price is null or min_price >= 0)
    and (max_price is null or max_price >= 0)
    and (min_price is null or max_price is null or min_price <= max_price)
  )
);

create table if not exists public.tenant_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'saved_search_match',
      'landlord_response',
      'price_drop',
      'availability_update',
      'verification_update',
      'system_announcement'
    )
  ),
  title text not null,
  body text not null,
  link_url text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('listing', 'landlord')),
  listing_id uuid references public.listings(id) on delete set null,
  landlord_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('scam', 'wrong_information', 'unavailable', 'unsafe', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  moderator_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_target_presence_check check (
    (target_type = 'listing' and listing_id is not null)
    or (target_type = 'landlord' and landlord_id is not null)
  )
);

create table if not exists public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('listing', 'landlord')),
  listing_id uuid references public.listings(id) on delete cascade,
  landlord_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  submitted_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint verification_target_presence_check check (
    (target_type = 'listing' and listing_id is not null)
    or (target_type = 'landlord' and landlord_id is not null)
  )
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists profiles_verified_landlord_idx on public.profiles(verified_landlord);
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_room_type_idx on public.listings(room_type);
create index if not exists listings_coordinates_idx on public.listings(latitude, longitude);
create index if not exists listings_available_expires_idx on public.listings(available, expires_at);
create index if not exists listings_available_created_at_idx on public.listings(available, created_at desc);
create index if not exists listing_images_listing_id_idx on public.listing_images(listing_id);
create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);
create index if not exists saved_searches_notifications_idx on public.saved_searches(notifications_enabled);
create index if not exists tenant_notifications_user_created_idx on public.tenant_notifications(user_id, created_at desc);
create index if not exists tenant_notifications_user_unread_idx on public.tenant_notifications(user_id) where read_at is null;
create index if not exists reports_listing_id_idx on public.reports(listing_id);
create index if not exists reports_landlord_id_idx on public.reports(landlord_id);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists verification_reviews_listing_idx on public.verification_reviews(listing_id);
create index if not exists verification_reviews_landlord_idx on public.verification_reviews(landlord_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_listing_expiry_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.expires_at is null then
    new.expires_at = now() + interval '45 days';
  end if;
  if new.refreshed_at is null then
    new.refreshed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists set_listing_expiry_defaults on public.listings;
create trigger set_listing_expiry_defaults before insert on public.listings
for each row execute function public.set_listing_expiry_defaults();

drop trigger if exists set_saved_searches_updated_at on public.saved_searches;
create trigger set_saved_searches_updated_at before update on public.saved_searches
for each row execute function public.set_updated_at();

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists set_verification_reviews_updated_at on public.verification_reviews;
create trigger set_verification_reviews_updated_at before update on public.verification_reviews
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
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.expire_stale_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.listings
  set available = false
  where available = true
    and expires_at is not null
    and expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.saved_search_matches_listing(search_row public.saved_searches, listing_row public.listings)
returns boolean
language sql
stable
as $$
  select
    listing_row.available = true
    and (listing_row.expires_at is null or listing_row.expires_at > now())
    and (coalesce(array_length(search_row.areas, 1), 0) = 0 or listing_row.location = any(search_row.areas))
    and (search_row.min_price is null or listing_row.price >= search_row.min_price)
    and (search_row.max_price is null or listing_row.price <= search_row.max_price)
    and (coalesce(array_length(search_row.room_types, 1), 0) = 0 or listing_row.room_type = any(search_row.room_types))
    and (
      search_row.keywords is null
      or listing_row.title ilike '%' || search_row.keywords || '%'
      or listing_row.description ilike '%' || search_row.keywords || '%'
      or listing_row.location ilike '%' || search_row.keywords || '%'
      or coalesce(listing_row.landmark, '') ilike '%' || search_row.keywords || '%'
    );
$$;

create or replace function public.notify_saved_search_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.available is distinct from true then
    return new;
  end if;

  insert into public.tenant_notifications (user_id, type, title, body, link_url, metadata)
  select distinct
    saved_searches.user_id,
    'saved_search_match',
    'New room matches your search',
    new.title || ' in ' || new.location || ' matches your saved preferences.',
    '/listing/' || new.id::text,
    jsonb_build_object('listing_id', new.id, 'saved_search_id', saved_searches.id, 'price', new.price)
  from public.saved_searches
  where saved_searches.notifications_enabled = true
    and saved_searches.user_id <> new.user_id
    and public.saved_search_matches_listing(saved_searches, new);

  return new;
end;
$$;

drop trigger if exists notify_saved_search_matches_on_listing_insert on public.listings;
create trigger notify_saved_search_matches_on_listing_insert
after insert on public.listings
for each row execute function public.notify_saved_search_matches();

create or replace function public.notify_listing_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.price is not null and new.price < old.price and new.available = true then
    insert into public.tenant_notifications (user_id, type, title, body, link_url, metadata)
    select distinct
      saved_searches.user_id,
      'price_drop',
      'Price drop in ' || new.location,
      new.title || ' dropped from R' || old.price::text || ' to R' || new.price::text || '.',
      '/listing/' || new.id::text,
      jsonb_build_object('listing_id', new.id, 'old_price', old.price, 'new_price', new.price)
    from public.saved_searches
    where saved_searches.notifications_enabled = true
      and saved_searches.user_id <> new.user_id
      and public.saved_search_matches_listing(saved_searches, new);
  end if;

  if old.available is distinct from new.available then
    insert into public.tenant_notifications (user_id, type, title, body, link_url, metadata)
    select distinct
      saved_searches.user_id,
      'availability_update',
      case when new.available then 'Room is available again' else 'Room availability changed' end,
      new.title || ' in ' || new.location || case when new.available then ' is available again.' else ' is no longer marked available.' end,
      '/listing/' || new.id::text,
      jsonb_build_object('listing_id', new.id, 'available', new.available)
    from public.saved_searches
    where saved_searches.notifications_enabled = true
      and saved_searches.user_id <> new.user_id
      and (
        public.saved_search_matches_listing(saved_searches, new)
        or public.saved_search_matches_listing(saved_searches, old)
      );
  end if;

  if old.verification_status is distinct from new.verification_status then
    insert into public.tenant_notifications (user_id, type, title, body, link_url, metadata)
    values (
      new.user_id,
      'verification_update',
      'Listing verification updated',
      new.title || ' is now marked ' || new.verification_status || '.',
      '/listing/' || new.id::text,
      jsonb_build_object('listing_id', new.id, 'verification_status', new.verification_status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_listing_change_on_update on public.listings;
create trigger notify_listing_change_on_update
after update of price, available, verification_status on public.listings
for each row execute function public.notify_listing_change();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.saved_searches enable row level security;
alter table public.tenant_notifications enable row level security;
alter table public.reports enable row level security;
alter table public.verification_reviews enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Listings are publicly readable" on public.listings;
create policy "Listings are publicly readable" on public.listings for select using (true);

drop policy if exists "Users can create own listings" on public.listings;
create policy "Users can create own listings" on public.listings for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings" on public.listings for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings" on public.listings for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Listing images are publicly readable" on public.listing_images;
create policy "Listing images are publicly readable" on public.listing_images for select using (true);

drop policy if exists "Users can add images to own listings" on public.listing_images;
create policy "Users can add images to own listings" on public.listing_images for insert to authenticated
with check (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.user_id = auth.uid()));

drop policy if exists "Users can update images on own listings" on public.listing_images;
create policy "Users can update images on own listings" on public.listing_images for update to authenticated
using (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.user_id = auth.uid()))
with check (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.user_id = auth.uid()));

drop policy if exists "Users can delete images on own listings" on public.listing_images;
create policy "Users can delete images on own listings" on public.listing_images for delete to authenticated
using (exists (select 1 from public.listings where listings.id = listing_images.listing_id and listings.user_id = auth.uid()));

drop policy if exists "Users can read their saved searches" on public.saved_searches;
create policy "Users can read their saved searches" on public.saved_searches for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their saved searches" on public.saved_searches;
create policy "Users can create their saved searches" on public.saved_searches for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their saved searches" on public.saved_searches;
create policy "Users can update their saved searches" on public.saved_searches for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved searches" on public.saved_searches;
create policy "Users can delete their saved searches" on public.saved_searches for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own notifications" on public.tenant_notifications;
create policy "Users can read own notifications" on public.tenant_notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can mark own notifications read" on public.tenant_notifications;
create policy "Users can mark own notifications read" on public.tenant_notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports" on public.reports for insert to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users can read their reports" on public.reports;
create policy "Users can read their reports" on public.reports for select to authenticated
using (auth.uid() = reporter_id);

drop policy if exists "Users can read related verification reviews" on public.verification_reviews;
create policy "Users can read related verification reviews" on public.verification_reviews for select to authenticated
using (
  submitted_by = auth.uid()
  or landlord_id = auth.uid()
  or exists (select 1 from public.listings where listings.id = verification_reviews.listing_id and listings.user_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images bucket is publicly readable" on storage.objects;
create policy "Listing images bucket is publicly readable" on storage.objects for select
using (bucket_id = 'listing-images');

drop policy if exists "Authenticated users can upload listing images" on storage.objects;
create policy "Authenticated users can upload listing images" on storage.objects for insert to authenticated
with check (bucket_id = 'listing-images');

drop policy if exists "Users can update images in their folder" on storage.objects;
create policy "Users can update images in their folder" on storage.objects for update to authenticated
using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete images in their folder" on storage.objects;
create policy "Users can delete images in their folder" on storage.objects for delete to authenticated
using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

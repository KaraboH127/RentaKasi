-- RentaKasi trust, location, privacy, and moderation migration
-- Run once in the Supabase SQL Editor after backing up production data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'landlord_trust_status') then
    create type landlord_trust_status as enum ('trust_pending', 'verified', 'suspended', 'banned');
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_action_type') then
    create type moderation_action_type as enum ('landlord_verified', 'landlord_suspended', 'landlord_banned', 'landlord_reinstated', 'auto_delisted', 'report_reviewed');
  end if;
end $$;

alter table public.profiles
  add column if not exists trust_status landlord_trust_status not null default 'trust_pending',
  add column if not exists trust_status_updated_at timestamptz,
  add column if not exists trust_status_updated_by uuid references auth.users(id),
  add column if not exists report_count integer not null default 0,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text;

alter table public.listings
  add column if not exists place_id uuid,
  add column if not exists delisted_at timestamptz,
  add column if not exists delisted_reason text;

alter table public.reports
  add column if not exists status text not null default 'open',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists resolved_at timestamptz,
  add column if not exists reporter_fingerprint text;

create table if not exists public.provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete restrict,
  name text not null,
  slug text not null,
  place_type text not null check (place_type in ('province', 'city', 'township', 'suburb')),
  municipality text,
  city text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (province_id, slug, place_type)
);

alter table public.listings
  drop constraint if exists listings_place_id_fkey,
  add constraint listings_place_id_fkey foreign key (place_id) references public.places(id) on delete set null;

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  landlord_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  action moderation_action_type not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.provinces (name, slug)
values
  ('Gauteng', 'gauteng'),
  ('Western Cape', 'western-cape')
on conflict (slug) do nothing;

insert into public.places (province_id, name, slug, place_type, municipality, city, latitude, longitude)
select p.id, v.name, v.slug, 'township', v.municipality, v.city, v.latitude, v.longitude
from public.provinces p
join (
  values
    ('Gauteng', 'Soweto', 'soweto', 'City of Johannesburg', 'Johannesburg', -26.2678000, 27.8585000),
    ('Gauteng', 'Tembisa', 'tembisa', 'Ekurhuleni', 'Kempton Park', -25.9964000, 28.2268000),
    ('Gauteng', 'Alexandra', 'alexandra', 'City of Johannesburg', 'Johannesburg', -26.1046000, 28.0969000),
    ('Gauteng', 'Katlehong', 'katlehong', 'Ekurhuleni', 'Germiston', -26.3333000, 28.1500000),
    ('Gauteng', 'Thokoza', 'thokoza', 'Ekurhuleni', 'Alberton', -26.3703000, 28.1517000),
    ('Gauteng', 'Vosloorus', 'vosloorus', 'Ekurhuleni', 'Boksburg', -26.3431000, 28.2131000),
    ('Gauteng', 'Mamelodi', 'mamelodi', 'City of Tshwane', 'Pretoria', -25.7069000, 28.3600000),
    ('Gauteng', 'Soshanguve', 'soshanguve', 'City of Tshwane', 'Pretoria', -25.5200000, 28.1000000),
    ('Western Cape', 'Mitchells Plain', 'mitchells-plain', 'City of Cape Town', 'Cape Town', -34.0506000, 18.6176000),
    ('Western Cape', 'Khayelitsha', 'khayelitsha', 'City of Cape Town', 'Cape Town', -34.0393000, 18.6776000),
    ('Western Cape', 'Gugulethu', 'gugulethu', 'City of Cape Town', 'Cape Town', -33.9833000, 18.5667000),
    ('Western Cape', 'Nyanga', 'nyanga', 'City of Cape Town', 'Cape Town', -33.9939000, 18.5847000)
) as v(province_name, name, slug, municipality, city, latitude, longitude) on p.name = v.province_name
on conflict (province_id, slug, place_type) do nothing;

update public.listings l
set place_id = p.id
from public.places p
where l.place_id is null
  and lower(l.location) = lower(p.name)
  and p.place_type = 'township';

create index if not exists idx_profiles_trust_status on public.profiles(trust_status);
create index if not exists idx_profiles_hidden_at on public.profiles(hidden_at);
create index if not exists idx_listings_place_id on public.listings(place_id);
create index if not exists idx_listings_available_expires on public.listings(available, expires_at);
create index if not exists idx_listings_user_available on public.listings(user_id, available);
create index if not exists idx_places_province_type on public.places(province_id, place_type, active);
create index if not exists idx_reports_landlord_open on public.reports(landlord_id, status) where target_type = 'landlord';
create index if not exists idx_reports_listing_open on public.reports(listing_id, status) where target_type = 'listing';
create unique index if not exists uq_reports_unique_landlord_reporter on public.reports(reporter_id, landlord_id) where target_type = 'landlord' and landlord_id is not null;
create unique index if not exists uq_reports_unique_listing_reporter on public.reports(reporter_id, listing_id) where target_type = 'listing' and listing_id is not null;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.prevent_profile_trust_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or current_setting('renta_kasi.allow_moderation_update', true) = 'on' then
    return new;
  end if;

  if old.trust_status is distinct from new.trust_status
    or old.trust_status_updated_at is distinct from new.trust_status_updated_at
    or old.trust_status_updated_by is distinct from new.trust_status_updated_by
    or old.report_count is distinct from new.report_count
    or old.hidden_at is distinct from new.hidden_at
    or old.hidden_reason is distinct from new.hidden_reason then
    raise exception 'Trust and moderation fields can only be changed by admins or moderation triggers.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_trust_tampering on public.profiles;
create trigger prevent_profile_trust_tampering
before update on public.profiles
for each row execute function public.prevent_profile_trust_tampering();

create or replace function public.set_landlord_trust_status(
  landlord_id uuid,
  next_status landlord_trust_status,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update landlord trust status.';
  end if;

  perform set_config('renta_kasi.allow_moderation_update', 'on', true);

  update public.profiles
  set trust_status = next_status,
      trust_status_updated_at = now(),
      trust_status_updated_by = auth.uid(),
      hidden_at = case when next_status in ('suspended', 'banned') then coalesce(hidden_at, now()) else null end,
      hidden_reason = case when next_status in ('suspended', 'banned') then reason else null end
  where id = landlord_id;

  if next_status in ('suspended', 'banned') then
    update public.listings
    set available = false,
        delisted_at = coalesce(delisted_at, now()),
        delisted_reason = coalesce(reason, 'Hidden by admin moderation.')
    where user_id = landlord_id;
  end if;

  insert into public.moderation_events (actor_id, landlord_id, action, reason)
  values (
    auth.uid(),
    landlord_id,
    case
      when next_status = 'verified' then 'landlord_verified'::moderation_action_type
      when next_status = 'suspended' then 'landlord_suspended'::moderation_action_type
      when next_status = 'banned' then 'landlord_banned'::moderation_action_type
      else 'landlord_reinstated'::moderation_action_type
    end,
    reason
  );
end;
$$;

create or replace function public.prevent_restricted_landlord_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  landlord_status landlord_trust_status;
  landlord_hidden_at timestamptz;
begin
  select trust_status, hidden_at
  into landlord_status, landlord_hidden_at
  from public.profiles
  where id = new.user_id;

  if landlord_status in ('suspended', 'banned') or landlord_hidden_at is not null then
    raise exception 'This landlord account cannot publish listings while under moderation.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_restricted_landlord_listings on public.listings;
create trigger prevent_restricted_landlord_listings
before insert or update of available on public.listings
for each row
when (new.available = true)
execute function public.prevent_restricted_landlord_listings();

create or replace function public.enforce_landlord_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_report_count integer;
begin
  if new.target_type <> 'landlord' or new.landlord_id is null then
    return new;
  end if;

  select count(distinct reporter_id)
  into unique_report_count
  from public.reports
  where target_type = 'landlord'
    and landlord_id = new.landlord_id
    and status = 'open';

  perform set_config('renta_kasi.allow_moderation_update', 'on', true);

  update public.profiles
  set report_count = unique_report_count
  where id = new.landlord_id;

  if unique_report_count > 2 then
    update public.profiles
    set trust_status = case when trust_status = 'banned' then 'banned' else 'suspended' end,
        trust_status_updated_at = now(),
        hidden_at = coalesce(hidden_at, now()),
        hidden_reason = 'Automatically delisted after more than 2 unique landlord reports.',
        report_count = unique_report_count
    where id = new.landlord_id;

    update public.listings
    set available = false,
        delisted_at = coalesce(delisted_at, now()),
        delisted_reason = 'Automatically hidden after landlord report threshold.'
    where user_id = new.landlord_id
      and available = true;

    insert into public.moderation_events (landlord_id, report_id, action, reason, metadata)
    values (
      new.landlord_id,
      new.id,
      'auto_delisted',
      'More than 2 unique landlord reports.',
      jsonb_build_object('unique_report_count', unique_report_count)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_landlord_report_threshold on public.reports;
create trigger enforce_landlord_report_threshold
after insert on public.reports
for each row execute function public.enforce_landlord_report_threshold();

alter table public.provinces enable row level security;
alter table public.places enable row level security;
alter table public.moderation_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'provinces' and policyname = 'Anyone can read provinces') then
    create policy "Anyone can read provinces" on public.provinces for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'places' and policyname = 'Anyone can read active places') then
    create policy "Anyone can read active places" on public.places for select using (active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'provinces' and policyname = 'Admins manage provinces') then
    create policy "Admins manage provinces" on public.provinces for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'places' and policyname = 'Admins manage places') then
    create policy "Admins manage places" on public.places for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'moderation_events' and policyname = 'Admins read moderation events') then
    create policy "Admins read moderation events" on public.moderation_events for select using (public.is_admin());
  end if;
end $$;

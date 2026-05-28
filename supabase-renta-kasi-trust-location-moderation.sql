-- RentaKasi landlord trust and moderation foundation
-- Run once in the Supabase SQL Editor after backing up production data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'landlord_verification_status') then
    create type public.landlord_verification_status as enum (
      'pending',
      'phone_verified',
      'trusted',
      'suspended',
      'banned'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_target_type') then
    create type public.report_target_type as enum ('landlord', 'listing');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_category') then
    create type public.report_category as enum (
      'scam',
      'fake_photos',
      'wrong_location',
      'spam',
      'dangerous',
      'no_response',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('open', 'in_review', 'resolved', 'dismissed');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_check_type') then
    create type public.verification_check_type as enum ('phone', 'identity', 'property', 'manual', 'ai_moderation');
  end if;

  if not exists (select 1 from pg_type where typname = 'verification_check_status') then
    create type public.verification_check_status as enum ('pending', 'passed', 'failed', 'expired');
  end if;

  if not exists (select 1 from pg_type where typname = 'landlord_moderation_action_type') then
    create type public.landlord_moderation_action_type as enum (
      'phone_verified',
      'marked_trusted',
      'suspended',
      'banned',
      'restored',
      'auto_hidden',
      'report_reviewed',
      'score_recalculated'
    );
  end if;
end $$;

alter type public.landlord_verification_status add value if not exists 'pending';
alter type public.landlord_verification_status add value if not exists 'phone_verified';
alter type public.landlord_verification_status add value if not exists 'trusted';
alter type public.landlord_verification_status add value if not exists 'suspended';
alter type public.landlord_verification_status add value if not exists 'banned';

alter type public.report_target_type add value if not exists 'landlord';
alter type public.report_target_type add value if not exists 'listing';

alter type public.report_category add value if not exists 'scam';
alter type public.report_category add value if not exists 'fake_photos';
alter type public.report_category add value if not exists 'wrong_location';
alter type public.report_category add value if not exists 'spam';
alter type public.report_category add value if not exists 'dangerous';
alter type public.report_category add value if not exists 'no_response';
alter type public.report_category add value if not exists 'other';

alter type public.report_status add value if not exists 'open';
alter type public.report_status add value if not exists 'in_review';
alter type public.report_status add value if not exists 'resolved';
alter type public.report_status add value if not exists 'dismissed';

alter type public.verification_check_type add value if not exists 'phone';
alter type public.verification_check_type add value if not exists 'identity';
alter type public.verification_check_type add value if not exists 'property';
alter type public.verification_check_type add value if not exists 'manual';
alter type public.verification_check_type add value if not exists 'ai_moderation';

alter type public.verification_check_status add value if not exists 'pending';
alter type public.verification_check_status add value if not exists 'passed';
alter type public.verification_check_status add value if not exists 'failed';
alter type public.verification_check_status add value if not exists 'expired';

alter type public.landlord_moderation_action_type add value if not exists 'phone_verified';
alter type public.landlord_moderation_action_type add value if not exists 'marked_trusted';
alter type public.landlord_moderation_action_type add value if not exists 'suspended';
alter type public.landlord_moderation_action_type add value if not exists 'banned';
alter type public.landlord_moderation_action_type add value if not exists 'restored';
alter type public.landlord_moderation_action_type add value if not exists 'auto_hidden';
alter type public.landlord_moderation_action_type add value if not exists 'report_reviewed';
alter type public.landlord_moderation_action_type add value if not exists 'score_recalculated';

alter table public.profiles
  add column if not exists landlord_verification_status public.landlord_verification_status not null default 'pending',
  add column if not exists landlord_verification_status_updated_at timestamptz,
  add column if not exists landlord_verification_status_updated_by uuid references auth.users(id) on delete set null,
  add column if not exists phone_e164 text,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists trust_score integer not null default 40 check (trust_score between 0 and 100),
  add column if not exists risk_score integer not null default 0 check (risk_score between 0 and 100),
  add column if not exists report_count integer not null default 0 check (report_count >= 0),
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists banned_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_phone_e164_format,
  add constraint profiles_phone_e164_format
    check (phone_e164 is null or phone_e164 ~ '^\+27[6-8][0-9]{8}$');

alter table public.listings
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text,
  add column if not exists moderation_review_required boolean not null default false;

create table if not exists public.landlord_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type public.report_target_type not null,
  landlord_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  category public.report_category not null,
  details text,
  status public.report_status not null default 'open',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landlord_reports_target_required check (
    (target_type = 'landlord' and landlord_id is not null)
    or
    (target_type = 'listing' and listing_id is not null)
  ),
  constraint landlord_reports_details_length check (details is null or char_length(details) <= 2000),
  constraint landlord_reports_not_self check (landlord_id is null or reporter_id <> landlord_id)
);

create table if not exists public.landlord_verifications (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade,
  check_type public.verification_check_type not null,
  status public.verification_check_status not null default 'pending',
  provider text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  landlord_id uuid references public.profiles(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  report_id uuid references public.landlord_reports(id) on delete set null,
  action public.landlord_moderation_action_type not null,
  previous_status public.landlord_verification_status,
  next_status public.landlord_verification_status,
  trust_score_before integer,
  trust_score_after integer,
  risk_score_before integer,
  risk_score_after integer,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_landlord_verification_status on public.profiles(landlord_verification_status);
create index if not exists idx_profiles_trust_risk_scores on public.profiles(trust_score desc, risk_score asc);
create index if not exists idx_profiles_hidden_at on public.profiles(hidden_at);
create index if not exists idx_listings_public_visibility on public.listings(available, hidden_at, moderation_review_required, expires_at);
create index if not exists idx_listings_user_visibility on public.listings(user_id, available, hidden_at);
create index if not exists idx_landlord_reports_landlord_status on public.landlord_reports(landlord_id, status, created_at desc);
create index if not exists idx_landlord_reports_listing_status on public.landlord_reports(listing_id, status, created_at desc);
create index if not exists idx_landlord_reports_reporter on public.landlord_reports(reporter_id, created_at desc);
create unique index if not exists uq_landlord_reports_unique_landlord_reporter
  on public.landlord_reports(reporter_id, landlord_id)
  where target_type = 'landlord' and landlord_id is not null;
create unique index if not exists uq_landlord_reports_unique_listing_reporter
  on public.landlord_reports(reporter_id, listing_id)
  where target_type = 'listing' and listing_id is not null;
create index if not exists idx_landlord_verifications_landlord_type on public.landlord_verifications(landlord_id, check_type, status);
create index if not exists idx_moderation_actions_landlord_created on public.moderation_actions(landlord_id, created_at desc);
create index if not exists idx_moderation_actions_report_created on public.moderation_actions(report_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_landlord_reports_updated_at on public.landlord_reports;
create trigger touch_landlord_reports_updated_at
before update on public.landlord_reports
for each row execute function public.touch_updated_at();

drop trigger if exists touch_landlord_verifications_updated_at on public.landlord_verifications;
create trigger touch_landlord_verifications_updated_at
before update on public.landlord_verifications
for each row execute function public.touch_updated_at();

create or replace function public.prevent_landlord_trust_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() or current_setting('renta_kasi.allow_trust_update', true) = 'on' then
    return new;
  end if;

  if old.landlord_verification_status is distinct from new.landlord_verification_status
    or old.landlord_verification_status_updated_at is distinct from new.landlord_verification_status_updated_at
    or old.landlord_verification_status_updated_by is distinct from new.landlord_verification_status_updated_by
    or old.phone_verified_at is distinct from new.phone_verified_at
    or old.trust_score is distinct from new.trust_score
    or old.risk_score is distinct from new.risk_score
    or old.report_count is distinct from new.report_count
    or old.hidden_at is distinct from new.hidden_at
    or old.hidden_reason is distinct from new.hidden_reason
    or old.suspended_at is distinct from new.suspended_at
    or old.banned_at is distinct from new.banned_at then
    raise exception 'Landlord trust and moderation fields can only be changed by trusted moderation flows.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_landlord_trust_tampering on public.profiles;
create trigger prevent_landlord_trust_tampering
before update on public.profiles
for each row execute function public.prevent_landlord_trust_tampering();

create or replace function public.prevent_restricted_landlord_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.landlord_verification_status;
  current_hidden_at timestamptz;
begin
  select landlord_verification_status, hidden_at
  into current_status, current_hidden_at
  from public.profiles
  where id = new.user_id;

  if current_status in ('suspended', 'banned') or current_hidden_at is not null then
    raise exception 'This landlord account cannot publish listings while under moderation.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_restricted_landlord_public_listing on public.listings;
create trigger prevent_restricted_landlord_public_listing
before insert or update of available, hidden_at on public.listings
for each row
when (new.available = true and new.hidden_at is null)
execute function public.prevent_restricted_landlord_public_listing();

create or replace function public.resolve_report_landlord()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_type = 'listing' then
    select user_id into new.landlord_id
    from public.listings
    where id = new.listing_id;

    if new.landlord_id is null then
      raise exception 'Listing report must reference an existing listing.';
    end if;
  end if;

  if new.landlord_id = new.reporter_id then
    raise exception 'You cannot report your own landlord profile or listing.';
  end if;

  return new;
end;
$$;

drop trigger if exists resolve_report_landlord on public.landlord_reports;
create trigger resolve_report_landlord
before insert on public.landlord_reports
for each row execute function public.resolve_report_landlord();

create or replace function public.recalculate_landlord_trust(target_landlord_id uuid, source_report_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_report_count integer;
  active_listing_count integer;
  landlord_created_at timestamptz;
  account_age_days integer;
  previous_status public.landlord_verification_status;
  next_status public.landlord_verification_status;
  old_trust integer;
  old_risk integer;
  next_trust integer;
  next_risk integer;
begin
  select
    landlord_verification_status,
    trust_score,
    risk_score,
    created_at
  into previous_status, old_trust, old_risk, landlord_created_at
  from public.profiles
  where id = target_landlord_id
  for update;

  if previous_status is null then
    return;
  end if;

  select count(distinct reporter_id)
  into unique_report_count
  from public.landlord_reports
  where landlord_id = target_landlord_id
    and status in ('open', 'in_review');

  select count(*)
  into active_listing_count
  from public.listings
  where user_id = target_landlord_id
    and available = true
    and hidden_at is null;

  account_age_days = greatest(0, floor(extract(epoch from (now() - coalesce(landlord_created_at, now()))) / 86400)::integer);

  next_risk = least(100, greatest(0, (unique_report_count * 25)));
  next_trust = 40
    + case previous_status when 'phone_verified' then 15 when 'trusted' then 35 else 0 end
    + least(10, account_age_days / 30)
    + least(10, active_listing_count * 2)
    - least(60, unique_report_count * 20);
  next_trust = least(100, greatest(0, next_trust));
  next_status = previous_status;

  if unique_report_count >= 3 and previous_status <> 'banned' then
    next_status = 'suspended';
  end if;

  perform set_config('renta_kasi.allow_trust_update', 'on', true);

  update public.profiles
  set report_count = unique_report_count,
      risk_score = next_risk,
      trust_score = next_trust,
      landlord_verification_status = next_status,
      landlord_verification_status_updated_at = case when next_status is distinct from previous_status then now() else landlord_verification_status_updated_at end,
      hidden_at = case when next_status in ('suspended', 'banned') then coalesce(hidden_at, now()) else hidden_at end,
      hidden_reason = case when next_status = 'suspended' and unique_report_count >= 3 then 'Automatically hidden after 3 unique reports.' else hidden_reason end,
      suspended_at = case when next_status = 'suspended' then coalesce(suspended_at, now()) else suspended_at end
  where id = target_landlord_id;

  if unique_report_count >= 3 then
    update public.listings
    set available = false,
        hidden_at = coalesce(hidden_at, now()),
        hidden_reason = 'Automatically hidden after landlord report threshold.',
        moderation_review_required = true
    where user_id = target_landlord_id
      and hidden_at is null;
  end if;

  insert into public.moderation_actions (
    landlord_id,
    report_id,
    action,
    previous_status,
    next_status,
    trust_score_before,
    trust_score_after,
    risk_score_before,
    risk_score_after,
    reason,
    metadata
  )
  values (
    target_landlord_id,
    source_report_id,
    case when unique_report_count >= 3 then 'auto_hidden' else 'score_recalculated' end,
    previous_status,
    next_status,
    old_trust,
    next_trust,
    old_risk,
    next_risk,
    case when unique_report_count >= 3 then '3 or more unique reports triggered automatic hiding.' else 'Trust scores recalculated from report activity.' end,
    jsonb_build_object(
      'unique_report_count', unique_report_count,
      'active_listing_count', active_listing_count,
      'account_age_days', account_age_days
    )
  );
end;
$$;

create or replace function public.apply_landlord_report_signal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_landlord_trust(new.landlord_id, new.id);
  return new;
end;
$$;

drop trigger if exists apply_landlord_report_signal on public.landlord_reports;
create trigger apply_landlord_report_signal
after insert on public.landlord_reports
for each row execute function public.apply_landlord_report_signal();

create or replace function public.set_landlord_verification_status(
  target_landlord_id uuid,
  next_status public.landlord_verification_status,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status public.landlord_verification_status;
  old_trust integer;
  old_risk integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update landlord verification status.';
  end if;

  select landlord_verification_status, trust_score, risk_score
  into previous_status, old_trust, old_risk
  from public.profiles
  where id = target_landlord_id
  for update;

  perform set_config('renta_kasi.allow_trust_update', 'on', true);

  update public.profiles
  set landlord_verification_status = next_status,
      landlord_verification_status_updated_at = now(),
      landlord_verification_status_updated_by = auth.uid(),
      phone_verified_at = case when next_status in ('phone_verified', 'trusted') then coalesce(phone_verified_at, now()) else phone_verified_at end,
      trust_score = case
        when next_status = 'trusted' then greatest(trust_score, 85)
        when next_status = 'phone_verified' then greatest(trust_score, 60)
        when next_status in ('suspended', 'banned') then least(trust_score, 20)
        else trust_score
      end,
      risk_score = case
        when next_status in ('suspended', 'banned') then greatest(risk_score, 75)
        when next_status in ('phone_verified', 'trusted') then least(risk_score, 25)
        else risk_score
      end,
      hidden_at = case when next_status in ('suspended', 'banned') then coalesce(hidden_at, now()) else null end,
      hidden_reason = case when next_status in ('suspended', 'banned') then reason else null end,
      suspended_at = case when next_status = 'suspended' then coalesce(suspended_at, now()) else suspended_at end,
      banned_at = case when next_status = 'banned' then coalesce(banned_at, now()) else banned_at end
  where id = target_landlord_id;

  if next_status in ('suspended', 'banned') then
    update public.listings
    set available = false,
        hidden_at = coalesce(hidden_at, now()),
        hidden_reason = coalesce(reason, 'Hidden by moderation action.'),
        moderation_review_required = true
    where user_id = target_landlord_id
      and hidden_at is null;
  end if;

  insert into public.moderation_actions (
    actor_id,
    landlord_id,
    action,
    previous_status,
    next_status,
    trust_score_before,
    trust_score_after,
    risk_score_before,
    risk_score_after,
    reason
  )
  select
    auth.uid(),
    target_landlord_id,
    case
      when next_status = 'phone_verified' then 'phone_verified'::public.landlord_moderation_action_type
      when next_status = 'trusted' then 'marked_trusted'::public.landlord_moderation_action_type
      when next_status = 'suspended' then 'suspended'::public.landlord_moderation_action_type
      when next_status = 'banned' then 'banned'::public.landlord_moderation_action_type
      else 'restored'::public.landlord_moderation_action_type
    end,
    previous_status,
    next_status,
    old_trust,
    trust_score,
    old_risk,
    risk_score,
    reason
  from public.profiles
  where id = target_landlord_id;
end;
$$;

alter table public.landlord_reports enable row level security;
alter table public.landlord_verifications enable row level security;
alter table public.moderation_actions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'landlord_reports' and policyname = 'Users can create their own reports') then
    create policy "Users can create their own reports"
      on public.landlord_reports for insert
      with check (auth.uid() = reporter_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'landlord_reports' and policyname = 'Users can read their own reports') then
    create policy "Users can read their own reports"
      on public.landlord_reports for select
      using (auth.uid() = reporter_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'landlord_reports' and policyname = 'Admins manage reports') then
    create policy "Admins manage reports"
      on public.landlord_reports for update
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'landlord_verifications' and policyname = 'Landlords read their verification checks') then
    create policy "Landlords read their verification checks"
      on public.landlord_verifications for select
      using (auth.uid() = landlord_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'landlord_verifications' and policyname = 'Admins manage verification checks') then
    create policy "Admins manage verification checks"
      on public.landlord_verifications for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'moderation_actions' and policyname = 'Admins read moderation actions') then
    create policy "Admins read moderation actions"
      on public.moderation_actions for select
      using (public.is_admin());
  end if;
end $$;

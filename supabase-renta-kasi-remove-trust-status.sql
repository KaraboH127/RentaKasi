-- RentaKasi trust_status removal migration
-- Purpose:
-- - Remove the legacy profiles.trust_status column if it exists.
-- - Keep landlord_verification_status as the only landlord display status.
-- - Preserve verification flags and moderation fields.
-- - Normalize legacy landlord_verification_status values into:
--   pending, verified, suspended, banned.

begin;

-- Collapse legacy verification-status values before adding the four-state guard.
update public.profiles
set landlord_verification_status = 'verified'::public.landlord_verification_status
where landlord_verification_status::text = 'trusted';

update public.profiles
set landlord_verification_status = 'pending'::public.landlord_verification_status
where landlord_verification_status::text = 'phone_verified';

alter table public.profiles
  drop constraint if exists profiles_landlord_verification_status_allowed;

alter table public.profiles
  add constraint profiles_landlord_verification_status_allowed
  check (landlord_verification_status::text in ('pending', 'verified', 'suspended', 'banned'));

-- Remove any known or conventionally named indexes tied to the legacy column.
drop index if exists public.idx_profiles_trust_status;
drop index if exists public.idx_profiles_trust_status_updated_at;

do $$
declare
  index_record record;
begin
  for index_record in
    select schemaname, indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'profiles'
      and indexdef ilike '%trust_status%'
  loop
    execute format('drop index if exists %I.%I', index_record.schemaname, index_record.indexname);
  end loop;
end $$;

-- Drop profile triggers whose definitions explicitly mention trust_status.
do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select tgname
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and not tgisinternal
      and pg_get_triggerdef(oid) ilike '%trust_status%'
  loop
    execute format('drop trigger if exists %I on public.profiles', trigger_record.tgname);
  end loop;
end $$;

-- Drop the legacy column without CASCADE so dependent views/rules are surfaced
-- instead of silently removed.
alter table public.profiles
  drop column if exists trust_status;

-- Keep the public listing guard aligned to the four visible verification states.
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

commit;

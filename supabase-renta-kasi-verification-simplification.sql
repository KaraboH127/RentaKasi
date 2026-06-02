-- RentaKasi verification simplification migration
-- Purpose:
-- - Support all verification statuses: pending, phone_verified, trusted, verified, suspended, banned
-- - Add granular verification check columns (phone_verified, id_verified, property_verified)
-- - Maintain landlord_verification_status as the public master status
-- - Preserve all existing trust/moderation records and enum values
-- - Keep moderation functions aligned with frontend implementation
--
-- SECURITY ARCHITECTURE:
-- 1. prevent_landlord_trust_tampering() trigger:
--    - Blocks unauthorized updates to trust/moderation fields
--    - Only allows updates when user is admin OR config flag is set
--    - Always resets config flag after update (prevents escalation)
--    - Provides detailed error messages showing which fields were attempted
--
-- 2. Admin Update Functions (secure paths):
--    - set_landlord_verification_status(): Simple status update with audit trail
--    - admin_update_landlord_verification(): Comprehensive update with multiple verification checks
--    - set_landlord_verification_checks(): Granular verification check updates
--    - All use: is_admin() check + config flag bypass + comprehensive logging
--
-- 3. Automatic Functions (trusted flows):
--    - recalculate_landlord_trust(): Auto-suspended on 3+ reports
--    - apply_landlord_report_signal(): Triggers score recalculation on new reports
--    - These functions set config flag internally for secure trigger bypass
--
-- 4. RLS Policies:
--    - Landlords cannot read/modify their own verification status
--    - Admins only can manage moderation_actions and verification checks
--    - Normal users blocked from all trust/moderation tables
--
-- USAGE:
-- Admins should use: SELECT * FROM admin_update_landlord_verification(...)
-- This returns: success, message, previous_status, new_status, action_id
--
-- Ensure all enum values exist (should already be in place from initial schema)
alter type public.landlord_verification_status add value if not exists 'phone_verified';
alter type public.landlord_verification_status add value if not exists 'trusted';
alter type public.landlord_verification_status add value if not exists 'verified';
alter type public.landlord_verification_status add value if not exists 'suspended';
alter type public.landlord_verification_status add value if not exists 'banned';

-- Add verification check columns if they don't exist
alter table public.profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists id_verified boolean not null default false,
  add column if not exists property_verified boolean not null default false;

alter table public.tenant_identities
  add column if not exists phone_verified boolean not null default false;

create index if not exists idx_profiles_verification_checks
  on public.profiles(phone_verified, id_verified, property_verified);

create index if not exists idx_tenant_identities_phone_verified
  on public.tenant_identities(phone_verified, last_seen_at desc);

create or replace function public.prevent_landlord_trust_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_config_allowed boolean;
  is_admin boolean;
  changed_fields text[] := array[]::text[];
begin
  -- Check if update is allowed via config (for trusted functions only)
  is_config_allowed := current_setting('renta_kasi.allow_trust_update', true) = 'on';
  
  -- Check if user is admin
  is_admin := public.is_admin();
  
  -- If neither admin nor config-allowed, block any trust/moderation changes
  if not is_admin and not is_config_allowed then
    -- Check for trust/moderation field changes
    if old.landlord_verification_status is distinct from new.landlord_verification_status then
      changed_fields := array_append(changed_fields, 'landlord_verification_status');
    end if;
    if old.landlord_verification_status_updated_at is distinct from new.landlord_verification_status_updated_at then
      changed_fields := array_append(changed_fields, 'landlord_verification_status_updated_at');
    end if;
    if old.landlord_verification_status_updated_by is distinct from new.landlord_verification_status_updated_by then
      changed_fields := array_append(changed_fields, 'landlord_verification_status_updated_by');
    end if;
    if old.phone_verified_at is distinct from new.phone_verified_at then
      changed_fields := array_append(changed_fields, 'phone_verified_at');
    end if;
    if old.phone_verified is distinct from new.phone_verified then
      changed_fields := array_append(changed_fields, 'phone_verified');
    end if;
    if old.id_verified is distinct from new.id_verified then
      changed_fields := array_append(changed_fields, 'id_verified');
    end if;
    if old.property_verified is distinct from new.property_verified then
      changed_fields := array_append(changed_fields, 'property_verified');
    end if;
    if old.trust_score is distinct from new.trust_score then
      changed_fields := array_append(changed_fields, 'trust_score');
    end if;
    if old.risk_score is distinct from new.risk_score then
      changed_fields := array_append(changed_fields, 'risk_score');
    end if;
    if old.report_count is distinct from new.report_count then
      changed_fields := array_append(changed_fields, 'report_count');
    end if;
    if old.hidden_at is distinct from new.hidden_at then
      changed_fields := array_append(changed_fields, 'hidden_at');
    end if;
    if old.hidden_reason is distinct from new.hidden_reason then
      changed_fields := array_append(changed_fields, 'hidden_reason');
    end if;
    if old.suspended_at is distinct from new.suspended_at then
      changed_fields := array_append(changed_fields, 'suspended_at');
    end if;
    if old.banned_at is distinct from new.banned_at then
      changed_fields := array_append(changed_fields, 'banned_at');
    end if;

    -- Reject if any trust/moderation fields changed
    if array_length(changed_fields, 1) > 0 then
      raise exception 'Unauthorized: Cannot modify trust/moderation fields. Changed: %', array_to_string(changed_fields, ', ');
    end if;
  end if;

  -- Always reset the config flag after update to prevent escalation
  perform set_config('renta_kasi.allow_trust_update', 'off', true);

  return new;
end;
$$;

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

  select count(distinct coalesce(reporter_tenant_identity_id::text, reporter_id::text))
  into unique_report_count
  from public.landlord_reports
  where landlord_id = target_landlord_id
    and status in ('open', 'in_review')
    and (reporter_tenant_identity_id is not null or reporter_id is not null);

  select count(*)
  into active_listing_count
  from public.listings
  where user_id = target_landlord_id
    and available = true
    and hidden_at is null;

  account_age_days = greatest(0, floor(extract(epoch from (now() - coalesce(landlord_created_at, now()))) / 86400)::integer);

  next_risk = least(100, greatest(0, (unique_report_count * 25)));
  next_trust = 40
    + case when previous_status in ('verified', 'trusted') then 35 else 0 end
    + least(10, account_age_days / 30)
    + least(10, active_listing_count * 2)
    - least(60, unique_report_count * 20);
  next_trust = least(100, greatest(0, next_trust));
  next_status = previous_status;

  if unique_report_count >= 3 and previous_status not in ('banned', 'suspended') then
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
      trust_score = case
        when next_status in ('verified', 'trusted') then greatest(trust_score, 85)
        when next_status in ('suspended', 'banned') then least(trust_score, 20)
        else trust_score
      end,
      risk_score = case
        when next_status in ('suspended', 'banned') then greatest(risk_score, 75)
        when next_status in ('verified', 'trusted') then least(risk_score, 25)
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
      when next_status in ('verified', 'trusted') then 'marked_trusted'::public.landlord_moderation_action_type
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

create or replace function public.admin_update_landlord_verification(
  target_landlord_id uuid,
  next_status public.landlord_verification_status default null,
  phone_verified_flag boolean default null,
  id_verified_flag boolean default null,
  property_verified_flag boolean default null,
  notes text default null
)
returns table (
  success boolean,
  message text,
  previous_status public.landlord_verification_status,
  new_status public.landlord_verification_status,
  action_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_previous_status public.landlord_verification_status;
  v_old_trust integer;
  v_old_risk integer;
  v_previous_phone_verified boolean;
  v_previous_id_verified boolean;
  v_previous_property_verified boolean;
  v_action_id uuid;
  v_updates text[] := array[]::text[];
  v_summary text;
begin
  -- Verify admin authorization
  v_admin_id := auth.uid();
  if not public.is_admin() then
    return query select false, 'Unauthorized: Only administrators can update landlord verification.'::text, null::public.landlord_verification_status, null::public.landlord_verification_status, null::uuid;
    return;
  end if;

  if target_landlord_id is null then
    return query select false, 'Error: target_landlord_id is required.'::text, null::public.landlord_verification_status, null::public.landlord_verification_status, null::uuid;
    return;
  end if;

  -- Get current state for audit trail (use for update to lock row)
  select landlord_verification_status, trust_score, risk_score, phone_verified, id_verified, property_verified
  into v_previous_status, v_old_trust, v_old_risk, v_previous_phone_verified, v_previous_id_verified, v_previous_property_verified
  from public.profiles
  where id = target_landlord_id
  for update;

  if v_previous_status is null then
    return query select false, 'Error: Landlord not found.'::text, null::public.landlord_verification_status, null::public.landlord_verification_status, null::uuid;
    return;
  end if;

  -- Track what's being updated
  if next_status is not null and next_status is distinct from v_previous_status then
    v_updates := array_append(v_updates, format('Status: %s → %s', v_previous_status, next_status));
  end if;
  if phone_verified_flag is not null and phone_verified_flag is distinct from v_previous_phone_verified then
    v_updates := array_append(v_updates, format('Phone Verified: %s → %s', v_previous_phone_verified, phone_verified_flag));
  end if;
  if id_verified_flag is not null and id_verified_flag is distinct from v_previous_id_verified then
    v_updates := array_append(v_updates, format('ID Verified: %s → %s', v_previous_id_verified, id_verified_flag));
  end if;
  if property_verified_flag is not null and property_verified_flag is distinct from v_previous_property_verified then
    v_updates := array_append(v_updates, format('Property Verified: %s → %s', v_previous_property_verified, property_verified_flag));
  end if;

  -- Apply updates via config-protected trigger bypass
  perform set_config('renta_kasi.allow_trust_update', 'on', true);

  update public.profiles
  set landlord_verification_status = coalesce(next_status, landlord_verification_status),
      landlord_verification_status_updated_at = case when next_status is not null and next_status is distinct from v_previous_status then now() else landlord_verification_status_updated_at end,
      landlord_verification_status_updated_by = v_admin_id,
      phone_verified = coalesce(phone_verified_flag, phone_verified),
      id_verified = coalesce(id_verified_flag, id_verified),
      property_verified = coalesce(property_verified_flag, property_verified),
      phone_verified_at = case when coalesce(phone_verified_flag, phone_verified) = true then coalesce(phone_verified_at, now()) else phone_verified_at end,
      trust_score = case
        when next_status in ('verified', 'trusted') then greatest(trust_score, 85)
        when next_status in ('suspended', 'banned') then least(trust_score, 20)
        else trust_score
      end,
      risk_score = case
        when next_status in ('suspended', 'banned') then greatest(risk_score, 75)
        when next_status in ('verified', 'trusted') then least(risk_score, 25)
        else risk_score
      end,
      hidden_at = case when next_status in ('suspended', 'banned') then coalesce(hidden_at, now()) else hidden_at end,
      hidden_reason = case when next_status in ('suspended', 'banned') then coalesce(notes, 'Hidden by admin action.') else null end,
      suspended_at = case when next_status = 'suspended' then coalesce(suspended_at, now()) else suspended_at end,
      banned_at = case when next_status = 'banned' then coalesce(banned_at, now()) else banned_at end
  where id = target_landlord_id;

  -- Auto-hide listings if status is suspended/banned
  if next_status in ('suspended', 'banned') then
    update public.listings
    set available = false,
        hidden_at = coalesce(hidden_at, now()),
        hidden_reason = coalesce(notes, 'Hidden by moderation action.'),
        moderation_review_required = true
    where user_id = target_landlord_id
      and hidden_at is null;
  end if;

  -- Create comprehensive audit record
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
    reason,
    metadata
  )
  select
    v_admin_id,
    target_landlord_id,
    case
      when next_status in ('verified', 'trusted') then 'marked_trusted'::public.landlord_moderation_action_type
      when next_status = 'suspended' then 'suspended'::public.landlord_moderation_action_type
      when next_status = 'banned' then 'banned'::public.landlord_moderation_action_type
      else 'score_recalculated'::public.landlord_moderation_action_type
    end,
    v_previous_status,
    coalesce(next_status, v_previous_status),
    v_old_trust,
    trust_score,
    v_old_risk,
    risk_score,
    coalesce(notes, 'Admin verification update: ' || array_to_string(v_updates, '; ')),
    jsonb_build_object(
      'admin_id', v_admin_id,
      'phone_verified', phone_verified_flag,
      'id_verified', id_verified_flag,
      'property_verified', property_verified_flag,
      'changes', v_updates
    )
  from public.profiles
  where id = target_landlord_id
  returning id into v_action_id;

  -- Prepare response
  v_summary := case 
    when array_length(v_updates, 1) is null or array_length(v_updates, 1) = 0 then 'No changes made.'
    else 'Updates: ' || array_to_string(v_updates, '; ')
  end;

  return query select 
    true,
    v_summary,
    v_previous_status,
    coalesce(next_status, v_previous_status),
    v_action_id;
end;
$$;

create or replace function public.set_landlord_verification_checks(
  target_landlord_id uuid,
  phone_verified_input boolean default null,
  id_verified_input boolean default null,
  property_verified_input boolean default null,
  next_status public.landlord_verification_status default null,
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
    raise exception 'Only admins can update landlord verification checks.';
  end if;

  select landlord_verification_status, trust_score, risk_score
  into previous_status, old_trust, old_risk
  from public.profiles
  where id = target_landlord_id
  for update;

  perform set_config('renta_kasi.allow_trust_update', 'on', true);

  update public.profiles
  set phone_verified = coalesce(phone_verified_input, phone_verified),
      id_verified = coalesce(id_verified_input, id_verified),
      property_verified = coalesce(property_verified_input, property_verified),
      phone_verified_at = case
        when coalesce(phone_verified_input, phone_verified) = true then coalesce(phone_verified_at, now())
        else phone_verified_at
      end,
      landlord_verification_status = coalesce(next_status, landlord_verification_status),
      landlord_verification_status_updated_at = case
        when next_status is not null and next_status is distinct from previous_status then now()
        else landlord_verification_status_updated_at
      end,
      landlord_verification_status_updated_by = case
        when next_status is not null and next_status is distinct from previous_status then auth.uid()
        else landlord_verification_status_updated_by
      end,
      trust_score = case
        when next_status in ('verified', 'trusted') then greatest(trust_score, 85)
        when next_status in ('suspended', 'banned') then least(trust_score, 20)
        else trust_score
      end,
      risk_score = case
        when next_status in ('suspended', 'banned') then greatest(risk_score, 75)
        when next_status in ('verified', 'trusted') then least(risk_score, 25)
        else risk_score
      end,
      hidden_at = case when next_status in ('suspended', 'banned') then coalesce(hidden_at, now()) else hidden_at end,
      hidden_reason = case when next_status in ('suspended', 'banned') then reason else hidden_reason end,
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

  if next_status is not null then
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
      reason,
      metadata
    )
    select
      auth.uid(),
      target_landlord_id,
      case
        when next_status in ('verified', 'trusted') then 'marked_trusted'::public.landlord_moderation_action_type
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
      reason,
      jsonb_build_object(
        'phone_verified', phone_verified,
        'id_verified', id_verified,
        'property_verified', property_verified
      )
    from public.profiles
    where id = target_landlord_id;
  end if;
end;
$$;

create or replace function public.get_landlord_moderation_history(target_landlord_id uuid, limit_count integer default 50)
returns table (
  action_id uuid,
  admin_id uuid,
  action public.landlord_moderation_action_type,
  previous_status public.landlord_verification_status,
  next_status public.landlord_verification_status,
  trust_before integer,
  trust_after integer,
  risk_before integer,
  risk_after integer,
  reason text,
  created_at timestamptz,
  metadata jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view moderation history.';
  end if;

  if target_landlord_id is null then
    raise exception 'target_landlord_id is required.';
  end if;

  return query
  select
    ma.id,
    ma.actor_id,
    ma.action,
    ma.previous_status,
    ma.next_status,
    ma.trust_score_before,
    ma.trust_score_after,
    ma.risk_score_before,
    ma.risk_score_after,
    ma.reason,
    ma.created_at,
    ma.metadata
  from public.moderation_actions ma
  where ma.landlord_id = target_landlord_id
  order by ma.created_at desc
  limit limit_count;
end;
$$;

create or replace function public.get_landlord_current_verification(target_landlord_id uuid)
returns table (
  landlord_id uuid,
  email text,
  full_name text,
  phone text,
  verification_status public.landlord_verification_status,
  status_updated_at timestamptz,
  phone_verified boolean,
  id_verified boolean,
  property_verified boolean,
  trust_score integer,
  risk_score integer,
  report_count integer,
  hidden_at timestamptz,
  suspended_at timestamptz,
  banned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can view verification details.';
  end if;

  if target_landlord_id is null then
    raise exception 'target_landlord_id is required.';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.landlord_verification_status,
    p.landlord_verification_status_updated_at,
    p.phone_verified,
    p.id_verified,
    p.property_verified,
    p.trust_score,
    p.risk_score,
    p.report_count,
    p.hidden_at,
    p.suspended_at,
    p.banned_at
  from public.profiles p
  where p.id = target_landlord_id;
end;
$$;

import { supabase } from '@/lib/supabase'
import { normalizeSouthAfricanPhone } from '@/lib/phone'

const TENANT_IDENTITY_STORAGE_KEY = 'renta-kasi.tenant-identity.v1'

export type TenantIdentityStatus = 'phone_captured' | 'otp_pending' | 'otp_verified' | 'blocked'

export interface TenantIdentity {
  id: string
  phoneDisplay: string
  phoneE164: string
  verificationStatus: TenantIdentityStatus
  otpVerifiedAt: string | null
}

interface StoredTenantIdentity {
  token: string
  phoneE164: string
}

interface TenantIdentityRow {
  id: string
  phone_display: string
  phone_e164: string
  verification_status: TenantIdentityStatus
  otp_verified_at: string | null
}

function readStoredIdentity(): StoredTenantIdentity | null {
  try {
    const value = window.localStorage.getItem(TENANT_IDENTITY_STORAGE_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as StoredTenantIdentity
    if (!parsed.token || !parsed.phoneE164) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredIdentity(identity: StoredTenantIdentity) {
  window.localStorage.setItem(TENANT_IDENTITY_STORAGE_KEY, JSON.stringify(identity))
}

function createIdentityToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function toTenantIdentity(row: TenantIdentityRow): TenantIdentity {
  return {
    id: row.id,
    phoneDisplay: row.phone_display,
    phoneE164: row.phone_e164,
    verificationStatus: row.verification_status,
    otpVerifiedAt: row.otp_verified_at,
  }
}

export async function getTenantIdentityTokenHash() {
  const stored = readStoredIdentity()
  if (!stored) return null
  return sha256Hex(stored.token)
}

export async function getOrCreateTenantIdentity(phoneInput: string): Promise<TenantIdentity> {
  const phone = normalizeSouthAfricanPhone(phoneInput)
  if (!phone.isValid) throw new Error('Enter a valid South African mobile number.')

  const stored = readStoredIdentity()
  const token = stored?.phoneE164 === phone.e164 ? stored.token : createIdentityToken()
  const tokenHash = await sha256Hex(token)

  const { data, error } = await supabase.rpc('create_or_get_tenant_identity', {
    phone_e164_input: phone.e164,
    phone_display_input: phone.display,
    verification_token_hash_input: tokenHash,
  })

  if (error) throw error

  writeStoredIdentity({ token, phoneE164: phone.e164 })
  return toTenantIdentity((Array.isArray(data) ? data[0] : data) as TenantIdentityRow)
}

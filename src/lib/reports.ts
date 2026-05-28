import { supabase } from '@/lib/supabase'
import { getTenantIdentityTokenHash } from '@/lib/tenant-identity'

export type ReportTargetType = 'listing' | 'landlord'
export type ReportCategory = 'scam' | 'fake_photos' | 'wrong_location' | 'spam' | 'dangerous' | 'no_response' | 'other'

export interface ReportInput {
  targetType: ReportTargetType
  listingId?: string | null
  landlordId?: string | null
  category: ReportCategory
  details?: string
}

export interface ReportResult {
  enforcementTriggered: boolean
}

export async function createReport(input: ReportInput): Promise<ReportResult> {
  if (input.targetType === 'listing' && !input.listingId) {
    throw new Error('A listing report must include the listing being reported.')
  }

  if (input.targetType === 'landlord' && !input.landlordId) {
    throw new Error('A landlord report must include the landlord being reported.')
  }

  const tokenHash = await getTenantIdentityTokenHash()
  if (!tokenHash) throw new Error('Please verify your phone number before submitting a report.')

  const { error } = await supabase.rpc('create_tenant_report', {
    verification_token_hash_input: tokenHash,
    target_type_input: input.targetType,
    listing_id_input: input.listingId ?? null,
    landlord_id_input: input.landlordId ?? null,
    category_input: input.category,
    details_input: input.details?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this item. The moderation team can use your existing report.')
    }
    throw error
  }
  return { enforcementTriggered: input.targetType === 'landlord' }
}

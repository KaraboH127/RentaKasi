import { supabase } from '@/lib/supabase'

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

export async function createReport(reporterId: string, input: ReportInput): Promise<ReportResult> {
  if (input.targetType === 'listing' && !input.listingId) {
    throw new Error('A listing report must include the listing being reported.')
  }

  if (input.targetType === 'landlord' && !input.landlordId) {
    throw new Error('A landlord report must include the landlord being reported.')
  }

  if (input.landlordId === reporterId) {
    throw new Error('You cannot report your own landlord profile or listing.')
  }

  const { error } = await supabase.from('landlord_reports').insert({
    reporter_id: reporterId,
    target_type: input.targetType,
    listing_id: input.listingId ?? null,
    landlord_id: input.landlordId ?? null,
    category: input.category,
    details: input.details?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this item. The moderation team can use your existing report.')
    }
    throw error
  }
  return { enforcementTriggered: input.targetType === 'landlord' }
}

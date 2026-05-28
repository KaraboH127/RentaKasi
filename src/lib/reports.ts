import { supabase } from '@/lib/supabase'

export type ReportTargetType = 'listing' | 'landlord'
export type ReportReason = 'scam' | 'wrong_information' | 'unavailable' | 'unsafe' | 'other'

export interface ReportInput {
  targetType: ReportTargetType
  listingId?: string | null
  landlordId?: string | null
  reason: ReportReason
  details?: string
}

export interface ReportResult {
  enforcementTriggered: boolean
}

export async function createReport(reporterId: string, input: ReportInput): Promise<ReportResult> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_type: input.targetType,
    listing_id: input.listingId ?? null,
    landlord_id: input.landlordId ?? null,
    reason: input.reason,
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

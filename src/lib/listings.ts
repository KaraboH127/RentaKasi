import { supabase } from '@/lib/supabase'
import { getTownshipsByProvince, type RoomType } from '@/lib/rental-options'
import { normalizeSouthAfricanPhone } from '@/lib/phone'

export type UserRole = 'tenant' | 'landlord'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type LandlordTrustStatus = 'pending' | 'phone_verified' | 'trusted' | 'suspended' | 'banned'
type LegacyLandlordTrustStatus = LandlordTrustStatus | 'trust_pending' | 'verified'

export interface Listing {
  id: string
  userId: string
  title: string
  description: string
  price: number
  location: string
  address: string | null
  landmark: string | null
  taxiRouteProximity: string | null
  transportInfo: string | null
  latitude: number | null
  longitude: number | null
  roomType: RoomType | null
  bedrooms: number | null
  bathrooms: number | null
  available: boolean
  verificationStatus: VerificationStatus
  lastVerifiedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  images: string[]
  outsidePhotoUrl: string | null
  streetPhotoUrl: string | null
  landlordName: string
  landlordPhone: string
  landlordTrustStatus: LandlordTrustStatus
  landlordVerified: boolean
  landlordHiddenAt: string | null
  landlordTrustScore: number
  landlordRiskScore: number
  landlordReportCount: number
  hiddenAt: string | null
  hiddenReason: string | null
  moderationReviewRequired: boolean
}

export interface ListingInput {
  title: string
  description: string
  price: number
  location: string
  address?: string | null
  landmark?: string | null
  taxiRouteProximity?: string | null
  transportInfo?: string | null
  latitude?: number | null
  longitude?: number | null
  roomType?: RoomType | null
  bedrooms?: number | null
  bathrooms?: number | null
  available?: boolean
  images?: string[]
  outsidePhotoUrl?: string | null
  streetPhotoUrl?: string | null
  landlordPhone?: string
}

interface ListingProfileRow {
  full_name: string | null
  phone: string | null
  verified_landlord: boolean | null
  verification_status: VerificationStatus | null
  trust_status: LegacyLandlordTrustStatus | null
  landlord_verification_status: LandlordTrustStatus | null
  hidden_at: string | null
  trust_score: number | null
  risk_score: number | null
  report_count: number | null
}

interface ListingRow {
  id: string
  user_id: string
  title: string
  description: string
  price: number | string
  location: string
  address: string | null
  landmark: string | null
  taxi_route_proximity: string | null
  transport_info: string | null
  latitude: number | string | null
  longitude: number | string | null
  room_type: RoomType | null
  place_id: string | null
  bedrooms: number | null
  bathrooms: number | null
  available: boolean
  verification_status: VerificationStatus | null
  last_verified_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  outside_photo_url: string | null
  street_photo_url: string | null
  hidden_at: string | null
  hidden_reason: string | null
  moderation_review_required: boolean | null
  profiles?: ListingProfileRow | ListingProfileRow[] | null
  listing_images?: { image_url: string }[] | null
}

const listingSelect = `
  id,
  user_id,
  title,
  description,
  price,
  location,
  address,
  landmark,
  taxi_route_proximity,
  transport_info,
  latitude,
  longitude,
  room_type,
  place_id,
  bedrooms,
  bathrooms,
  available,
  verification_status,
  last_verified_at,
  expires_at,
  created_at,
  updated_at,
  outside_photo_url,
  street_photo_url,
  hidden_at,
  hidden_reason,
  moderation_review_required,
  profiles:user_id!inner(full_name, phone, verified_landlord, verification_status, trust_status, landlord_verification_status, hidden_at, trust_score, risk_score, report_count),
  listing_images(image_url)
`

function normalizeLandlordTrustStatus(profile?: ListingProfileRow | null): LandlordTrustStatus {
  if (!profile) return 'pending'

  if (profile.landlord_verification_status) return profile.landlord_verification_status
  if (profile.trust_status === 'suspended' || profile.trust_status === 'banned') return profile.trust_status
  if (profile.trust_status === 'trusted' || profile.trust_status === 'phone_verified') return profile.trust_status
  if (profile.trust_status === 'verified' || profile.verification_status === 'verified' || profile.verified_landlord) return 'trusted'

  return 'pending'
}

function getListingVisibilityRank(listing: Listing) {
  const statusWeight: Record<LandlordTrustStatus, number> = {
    trusted: 500,
    phone_verified: 250,
    pending: 0,
    suspended: -1000,
    banned: -2000,
  }

  return statusWeight[listing.landlordTrustStatus]
    + listing.landlordTrustScore
    - listing.landlordRiskScore
    + (listing.verificationStatus === 'verified' ? 100 : 0)
}

function toListing(row: ListingRow): Listing {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const landlordTrustStatus = normalizeLandlordTrustStatus(profile)

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    location: row.location,
    address: row.address,
    landmark: row.landmark,
    taxiRouteProximity: row.taxi_route_proximity,
    transportInfo: row.transport_info,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    roomType: row.room_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    available: row.available,
    verificationStatus: row.verification_status ?? 'unverified',
    lastVerifiedAt: row.last_verified_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: row.listing_images?.map((image) => image.image_url) ?? [],
    outsidePhotoUrl: row.outside_photo_url,
    streetPhotoUrl: row.street_photo_url,
    landlordName: profile?.full_name || 'RentaKasi landlord',
    landlordPhone: profile?.phone || '',
    landlordTrustStatus,
    landlordVerified: landlordTrustStatus === 'trusted' || landlordTrustStatus === 'phone_verified',
    landlordHiddenAt: profile?.hidden_at ?? null,
    landlordTrustScore: profile?.trust_score ?? 40,
    landlordRiskScore: profile?.risk_score ?? 0,
    landlordReportCount: profile?.report_count ?? 0,
    hiddenAt: row.hidden_at,
    hiddenReason: row.hidden_reason,
    moderationReviewRequired: row.moderation_review_required ?? false,
  }
}

export async function getListings(filters?: {
  search?: string
  location?: string
  province?: string
  minPrice?: number
  maxPrice?: number
  roomType?: RoomType
  userId?: string
  limit?: number
}) {
  let query = supabase
    .from('listings')
    .select(listingSelect)
    .order('created_at', { ascending: false })

  if (!filters?.userId) {
    query = query
      .eq('available', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .is('hidden_at', null)
      .is('profiles.hidden_at', null)
      .not('profiles.landlord_verification_status', 'in', '("suspended","banned")')
  }

  if (filters?.userId) query = query.eq('user_id', filters.userId)
  if (filters?.location) query = query.ilike('location', `%${filters.location}%`)
  if (!filters?.location && filters?.province && filters.province !== 'all') {
    query = query.in('location', getTownshipsByProvince(filters.province).map((township) => township.name))
  }
  if (filters?.minPrice) query = query.gte('price', filters.minPrice)
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters?.roomType) query = query.eq('room_type', filters.roomType)
  if (filters?.search) {
    const term = `%${filters.search}%`
    query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term},landmark.ilike.${term},taxi_route_proximity.ilike.${term}`)
  }
  if (filters?.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  const listings = (data as unknown as ListingRow[]).map(toListing)

  if (filters?.userId) return listings
  return listings.sort((a, b) => {
    const rankDifference = getListingVisibilityRank(b) - getListingVisibilityRank(a)
    if (rankDifference !== 0) return rankDifference
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export async function getListingById(id: string, options?: { includeModerated?: boolean }) {
  let query = supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', id)

  if (!options?.includeModerated) {
    query = query
      .eq('available', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .is('hidden_at', null)
      .is('profiles.hidden_at', null)
      .not('profiles.landlord_verification_status', 'in', '("suspended","banned")')
  }

  const { data, error } = await query.single()

  if (error) throw error
  return toListing(data as unknown as ListingRow)
}

export async function createListing(userId: string, input: ListingInput) {
  if (input.landlordPhone) await updateProfilePhone(userId, input.landlordPhone)

  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      price: input.price,
      location: input.location,
      address: input.address ?? null,
      landmark: input.landmark ?? null,
      taxi_route_proximity: input.taxiRouteProximity ?? null,
      transport_info: input.transportInfo ?? null,
      place_id: await resolvePlaceId(input.location),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      room_type: input.roomType ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      available: input.available ?? true,
      outside_photo_url: input.outsidePhotoUrl ?? null,
      street_photo_url: input.streetPhotoUrl ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  await replaceListingImages(data.id, input.images ?? [])
  return getListingById(data.id, { includeModerated: true })
}

export async function updateListing(id: string, userId: string, input: ListingInput) {
  if (input.landlordPhone) await updateProfilePhone(userId, input.landlordPhone)

  const { error } = await supabase
    .from('listings')
    .update({
      title: input.title,
      description: input.description,
      price: input.price,
      location: input.location,
      address: input.address ?? null,
      landmark: input.landmark ?? null,
      taxi_route_proximity: input.taxiRouteProximity ?? null,
      transport_info: input.transportInfo ?? null,
      place_id: await resolvePlaceId(input.location),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      room_type: input.roomType ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      available: input.available ?? true,
      outside_photo_url: input.outsidePhotoUrl ?? null,
      street_photo_url: input.streetPhotoUrl ?? null,
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
  await replaceListingImages(id, input.images ?? [])
  return getListingById(id, { includeModerated: true })
}

export async function deleteListing(id: string, userId: string) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function refreshListing(id: string, userId: string) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 45)

  const { error } = await supabase
    .from('listings')
    .update({ available: true, expires_at: expiresAt.toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getListingStats() {
  const listings = await getListings()
  const totalListings = listings.length
  const totalLocations = new Set(listings.map((listing) => listing.location)).size
  const avgPrice = totalListings
    ? listings.reduce((sum, listing) => sum + listing.price, 0) / totalListings
    : 0

  return { totalListings, totalLocations, avgPrice }
}

async function replaceListingImages(listingId: string, imageUrls: string[]) {
  const { error: deleteError } = await supabase
    .from('listing_images')
    .delete()
    .eq('listing_id', listingId)

  if (deleteError) throw deleteError
  if (imageUrls.length === 0) return

  const { error } = await supabase.from('listing_images').insert(
    imageUrls.map((imageUrl) => ({ listing_id: listingId, image_url: imageUrl })),
  )

  if (error) throw error
}

async function updateProfilePhone(userId: string, phone: string) {
  const normalizedPhone = normalizeSouthAfricanPhone(phone)
  if (!normalizedPhone.isValid) throw new Error('Enter a valid South African mobile number.')

  const { error } = await supabase
    .from('profiles')
    .update({ phone: normalizedPhone.display, phone_e164: normalizedPhone.e164 })
    .eq('id', userId)

  if (error) throw error
}

async function resolvePlaceId(location: string) {
  const { data, error } = await supabase
    .from('places')
    .select('id')
    .eq('place_type', 'township')
    .ilike('name', location)
    .maybeSingle()

  if (error) return null
  return data?.id ?? null
}

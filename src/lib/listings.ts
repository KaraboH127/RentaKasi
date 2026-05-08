import { supabase } from '@/lib/supabase'

export type UserRole = 'tenant' | 'landlord'

export interface Listing {
  id: string
  userId: string
  title: string
  description: string
  price: number
  location: string
  bedrooms: number | null
  bathrooms: number | null
  available: boolean
  createdAt: string
  updatedAt: string
  images: string[]
  landlordName: string
  landlordPhone: string
}

export interface ListingInput {
  title: string
  description: string
  price: number
  location: string
  bedrooms?: number | null
  bathrooms?: number | null
  available?: boolean
  images?: string[]
  landlordPhone?: string
}

interface ListingRow {
  id: string
  user_id: string
  title: string
  description: string
  price: number | string
  location: string
  bedrooms: number | null
  bathrooms: number | null
  available: boolean
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] | null
  listing_images?: { image_url: string }[] | null
}

const listingSelect = `
  id,
  user_id,
  title,
  description,
  price,
  location,
  bedrooms,
  bathrooms,
  available,
  created_at,
  updated_at,
  profiles:user_id(full_name, phone),
  listing_images(image_url)
`

function toListing(row: ListingRow): Listing {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    location: row.location,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    available: row.available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: row.listing_images?.map((image) => image.image_url) ?? [],
    landlordName: profile?.full_name || 'RentaKasi landlord',
    landlordPhone: profile?.phone || '',
  }
}

export async function getListings(filters?: {
  search?: string
  location?: string
  maxPrice?: number
  userId?: string
  limit?: number
}) {
  let query = supabase
    .from('listings')
    .select(listingSelect)
    .eq('available', true)
    .order('created_at', { ascending: false })

  if (filters?.userId) query = query.eq('user_id', filters.userId)
  if (filters?.location) query = query.ilike('location', `%${filters.location}%`)
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters?.search) {
    const term = `%${filters.search}%`
    query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`)
  }
  if (filters?.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return (data as unknown as ListingRow[]).map(toListing)
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', id)
    .single()

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
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      available: input.available ?? true,
    })
    .select('id')
    .single()

  if (error) throw error
  await replaceListingImages(data.id, input.images ?? [])
  return getListingById(data.id)
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
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      available: input.available ?? true,
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
  await replaceListingImages(id, input.images ?? [])
  return getListingById(id)
}

export async function deleteListing(id: string, userId: string) {
  const { error } = await supabase
    .from('listings')
    .delete()
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
  const { error } = await supabase
    .from('profiles')
    .update({ phone })
    .eq('id', userId)

  if (error) throw error
}

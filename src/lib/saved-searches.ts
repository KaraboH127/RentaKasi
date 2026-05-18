import { supabase } from '@/lib/supabase'
import type { RoomType } from '@/lib/rental-options'

export interface SavedSearch {
  id: string
  userId: string
  name: string
  areas: string[]
  minPrice: number | null
  maxPrice: number | null
  roomTypes: RoomType[]
  keywords: string | null
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SavedSearchInput {
  name: string
  areas: string[]
  minPrice?: number | null
  maxPrice?: number | null
  roomTypes: RoomType[]
  keywords?: string | null
  notificationsEnabled?: boolean
}

interface SavedSearchRow {
  id: string
  user_id: string
  name: string
  areas: string[] | null
  min_price: number | null
  max_price: number | null
  room_types: RoomType[] | null
  keywords: string | null
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

function toSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    areas: row.areas ?? [],
    minPrice: row.min_price,
    maxPrice: row.max_price,
    roomTypes: row.room_types ?? [],
    keywords: row.keywords,
    notificationsEnabled: row.notifications_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSavedSearches(userId: string) {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('id,user_id,name,areas,min_price,max_price,room_types,keywords,notifications_enabled,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as SavedSearchRow[]).map(toSavedSearch)
}

export async function createSavedSearch(userId: string, input: SavedSearchInput) {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      name: input.name,
      areas: input.areas,
      min_price: input.minPrice ?? null,
      max_price: input.maxPrice ?? null,
      room_types: input.roomTypes,
      keywords: input.keywords?.trim() || null,
      notifications_enabled: input.notificationsEnabled ?? true,
    })
    .select('id,user_id,name,areas,min_price,max_price,room_types,keywords,notifications_enabled,created_at,updated_at')
    .single()

  if (error) throw error
  return toSavedSearch(data as SavedSearchRow)
}

export async function deleteSavedSearch(id: string, userId: string) {
  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

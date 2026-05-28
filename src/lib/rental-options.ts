export type RoomType = 'room' | 'back_room' | 'cottage' | 'apartment' | 'shared'

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'room', label: 'Single room' },
  { value: 'back_room', label: 'Back room' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'shared', label: 'Shared space' },
]

export interface TownshipOption {
  name: string
  province: string
  municipality: string
  city: string
  latitude: number
  longitude: number
}

export const TOWNSHIPS: TownshipOption[] = [
  { name: 'Soweto', province: 'Gauteng', municipality: 'City of Johannesburg', city: 'Johannesburg', latitude: -26.2678, longitude: 27.8585 },
  { name: 'Tembisa', province: 'Gauteng', municipality: 'Ekurhuleni', city: 'Kempton Park', latitude: -25.9964, longitude: 28.2268 },
  { name: 'Alexandra', province: 'Gauteng', municipality: 'City of Johannesburg', city: 'Johannesburg', latitude: -26.1046, longitude: 28.0969 },
  { name: 'Katlehong', province: 'Gauteng', municipality: 'Ekurhuleni', city: 'Germiston', latitude: -26.3333, longitude: 28.1500 },
  { name: 'Thokoza', province: 'Gauteng', municipality: 'Ekurhuleni', city: 'Alberton', latitude: -26.3703, longitude: 28.1517 },
  { name: 'Vosloorus', province: 'Gauteng', municipality: 'Ekurhuleni', city: 'Boksburg', latitude: -26.3431, longitude: 28.2131 },
  { name: 'Mamelodi', province: 'Gauteng', municipality: 'City of Tshwane', city: 'Pretoria', latitude: -25.7069, longitude: 28.3600 },
  { name: 'Soshanguve', province: 'Gauteng', municipality: 'City of Tshwane', city: 'Pretoria', latitude: -25.5200, longitude: 28.1000 },
  { name: 'Mitchells Plain', province: 'Western Cape', municipality: 'City of Cape Town', city: 'Cape Town', latitude: -34.0506, longitude: 18.6176 },
  { name: 'Khayelitsha', province: 'Western Cape', municipality: 'City of Cape Town', city: 'Cape Town', latitude: -34.0393, longitude: 18.6776 },
  { name: 'Gugulethu', province: 'Western Cape', municipality: 'City of Cape Town', city: 'Cape Town', latitude: -33.9833, longitude: 18.5667 },
  { name: 'Nyanga', province: 'Western Cape', municipality: 'City of Cape Town', city: 'Cape Town', latitude: -33.9939, longitude: 18.5847 },
]

export const PROVINCES = Array.from(new Set(TOWNSHIPS.map((township) => township.province))).sort()
export const LOCATIONS = TOWNSHIPS.map((township) => township.name)

export function getTownshipByName(name?: string | null) {
  if (!name) return null
  return TOWNSHIPS.find((township) => township.name.toLowerCase() === name.toLowerCase()) ?? null
}

export function getTownshipsByProvince(province?: string | null) {
  if (!province || province === 'all') return TOWNSHIPS
  return TOWNSHIPS.filter((township) => township.province === province)
}

export function getRoomTypeLabel(value?: string | null) {
  return ROOM_TYPES.find((type) => type.value === value)?.label || 'Room'
}

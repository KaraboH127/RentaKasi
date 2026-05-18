export type RoomType = 'room' | 'back_room' | 'cottage' | 'apartment' | 'shared'

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'room', label: 'Single room' },
  { value: 'back_room', label: 'Back room' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'shared', label: 'Shared space' },
]

export const LOCATIONS = [
  'Soweto',
  'Tembisa',
  'Alexandra',
  'Katlehong',
  'Thokoza',
  'Vosloorus',
  'Mamelodi',
  'Soshanguve',
  'Mitchells Plain',
  'Khayelitsha',
  'Gugulethu',
  'Nyanga',
]

export function getRoomTypeLabel(value?: string | null) {
  return ROOM_TYPES.find((type) => type.value === value)?.label || 'Room'
}

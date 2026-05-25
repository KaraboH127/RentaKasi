import { JOHANNESBURG_COORDS } from '@/lib/location'

export interface MapCoordinates {
  latitude: number
  longitude: number
}

export interface ResolvedMapLocation extends MapCoordinates {
  address: string | null
  placeId?: string | null
}

declare global {
  interface Window {
    google?: any
    __rentaKasiGoogleMapsInit?: () => void
    __rentaKasiGoogleMapsPromise?: Promise<any>
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'renta-kasi-google-maps'
const SOUTH_AFRICA_BOUNDS = {
  east: 33.0,
  north: -22.0,
  south: -35.0,
  west: 16.0,
}

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
}

export function getGoogleMapsMapId() {
  return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || undefined
}

export function hasGoogleMapsApiKey() {
  return getGoogleMapsApiKey().length > 0
}

export async function loadGoogleMapsApi() {
  if (typeof window === 'undefined') throw new Error('Google Maps can only load in the browser.')
  if (window.google?.maps) return window.google

  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) throw new Error('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your environment.')

  if (window.__rentaKasiGoogleMapsPromise) return window.__rentaKasiGoogleMapsPromise

  window.__rentaKasiGoogleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null

    window.__rentaKasiGoogleMapsInit = () => resolve(window.google)

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    const params = new URLSearchParams({
      callback: '__rentaKasiGoogleMapsInit',
      key: apiKey,
      language: 'en',
      libraries: 'places,marker',
      loading: 'async',
      region: 'ZA',
      v: 'weekly',
    })

    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.onerror = () => reject(new Error('Google Maps failed to load. Check the API key and enabled APIs.'))

    document.head.appendChild(script)
  })

  return window.__rentaKasiGoogleMapsPromise
}

export function getSouthAfricaBounds(google: any) {
  return new google.maps.LatLngBounds(
    { lat: SOUTH_AFRICA_BOUNDS.south, lng: SOUTH_AFRICA_BOUNDS.west },
    { lat: SOUTH_AFRICA_BOUNDS.north, lng: SOUTH_AFRICA_BOUNDS.east },
  )
}

export function toGoogleLatLng(coords: MapCoordinates) {
  return { lat: coords.latitude, lng: coords.longitude }
}

export function fromGoogleLatLng(location: any): MapCoordinates {
  return {
    latitude: Number(location.lat().toFixed(6)),
    longitude: Number(location.lng().toFixed(6)),
  }
}

export async function importGoogleMapsLibraries() {
  const google = await loadGoogleMapsApi()

  if (google.maps.importLibrary) {
    await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('places'),
      google.maps.importLibrary('marker').catch(() => null),
    ])
  }

  return google
}

export async function geocodeAddress(address: string): Promise<ResolvedMapLocation | null> {
  const google = await importGoogleMapsLibraries()
  const geocoder = new google.maps.Geocoder()

  const results = await geocode(geocoder, {
    address,
    bounds: getSouthAfricaBounds(google),
    componentRestrictions: { country: 'ZA' },
    region: 'za',
  })

  const result = results[0]
  if (!result?.geometry?.location) return null

  return {
    ...fromGoogleLatLng(result.geometry.location),
    address: result.formatted_address ?? address,
    placeId: result.place_id ?? null,
  }
}

export async function reverseGeocodeGoogle(coords: MapCoordinates): Promise<ResolvedMapLocation | null> {
  const google = await importGoogleMapsLibraries()
  const geocoder = new google.maps.Geocoder()
  const results = await geocode(geocoder, {
    location: toGoogleLatLng(coords),
    region: 'za',
  })

  const result = results[0]

  return {
    ...coords,
    address: result?.formatted_address ?? null,
    placeId: result?.place_id ?? null,
  }
}

export function getDefaultMapCenter(lastLocation?: MapCoordinates | null) {
  return lastLocation ?? JOHANNESBURG_COORDS
}

function geocode(geocoder: any, request: Record<string, unknown>): Promise<any[]> {
  return new Promise((resolve, reject) => {
    geocoder.geocode(request, (results: any[] | null, status: string) => {
      if (status === 'OK') {
        resolve(results ?? [])
        return
      }

      if (status === 'ZERO_RESULTS') {
        resolve([])
        return
      }

      reject(new Error(`Google geocoding failed with status: ${status}`))
    })
  })
}

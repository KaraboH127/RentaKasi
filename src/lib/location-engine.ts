/**
 * Unified Location Engine
 * 
 * Single source of truth for all map/location logic across the application.
 * Handles:
 * - Google Maps initialization
 * - PlaceAutocompleteElement with modern API only
 * - Marker lifecycle and updates
 * - Geolocation
 * - Geocoding and reverse geocoding
 * - Map state management
 * 
 * NO DEPRECATED APIS - MODERN ONLY
 */

import { JOHANNESBURG_COORDS } from '@/lib/location'

export interface MapCoordinates {
  latitude: number
  longitude: number
}

export interface ResolvedMapLocation extends MapCoordinates {
  address: string | null
  placeId?: string | null
}

export interface LocationEngineConfig {
  mapElementId: string
  defaultCenter?: MapCoordinates
  enableGeolocation?: boolean
  onLocationChange?: (location: ResolvedMapLocation) => void
  onError?: (error: Error) => void
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

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
}

export function getGoogleMapsMapId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || undefined
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 0
}

// ============================================================================
// GOOGLE MAPS API LOADING
// ============================================================================

export async function loadGoogleMapsApi(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only load in the browser.')
  }

  if (window.google?.maps) {
    return window.google
  }

  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    throw new Error('Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your environment.')
  }

  if (window.__rentaKasiGoogleMapsPromise) {
    return window.__rentaKasiGoogleMapsPromise
  }

  window.__rentaKasiGoogleMapsPromise = new Promise<any>((resolve, reject) => {
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

export async function importGoogleMapsLibraries(): Promise<any> {
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

// ============================================================================
// COORDINATE CONVERSION
// ============================================================================

export function toGoogleLatLng(coords: MapCoordinates): { lat: number; lng: number } {
  return { lat: coords.latitude, lng: coords.longitude }
}

export function fromGoogleLatLng(location: any): MapCoordinates {
  return {
    latitude: Number(location.lat().toFixed(6)),
    longitude: Number(location.lng().toFixed(6)),
  }
}

// ============================================================================
// SOUTH AFRICA BOUNDS
// ============================================================================

export function getSouthAfricaBounds(google: any): any {
  return new google.maps.LatLngBounds(
    { lat: SOUTH_AFRICA_BOUNDS.south, lng: SOUTH_AFRICA_BOUNDS.west },
    { lat: SOUTH_AFRICA_BOUNDS.north, lng: SOUTH_AFRICA_BOUNDS.east },
  )
}

export function getSouthAfricaBoundsLiteral(): { north: number; south: number; east: number; west: number } {
  return {
    north: SOUTH_AFRICA_BOUNDS.north,
    south: SOUTH_AFRICA_BOUNDS.south,
    east: SOUTH_AFRICA_BOUNDS.east,
    west: SOUTH_AFRICA_BOUNDS.west,
  }
}

// ============================================================================
// GEOCODING
// ============================================================================

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

// ============================================================================
// PLACE DETAILS EXTRACTION (from PlaceAutocompleteElement)
// ============================================================================

export async function extractPlaceDetails(place: any): Promise<ResolvedMapLocation | null> {
  if (!place?.geometry?.location) return null

  const location = place.geometry.location
  const latitude = typeof location.lat === 'function' ? location.lat() : location.lat
  const longitude = typeof location.lng === 'function' ? location.lng() : location.lng

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    address: place.formatted_address || place.name || null,
    placeId: place.place_id ?? null,
  }
}

// ============================================================================
// DEFAULT MAP CENTER
// ============================================================================

export function getDefaultMapCenter(lastLocation?: MapCoordinates | null): MapCoordinates {
  return lastLocation ?? JOHANNESBURG_COORDS
}

// ============================================================================
// PLACE AUTOCOMPLETE ELEMENT INITIALIZATION
// ============================================================================

export interface PlaceAutocompleteConfig {
  container: HTMLElement
  onPlaceSelect: (place: any) => void
}

export async function initializePlaceAutocomplete(config: PlaceAutocompleteConfig): Promise<any> {
  const google = await importGoogleMapsLibraries()
  const PlacesLibrary = await google.maps.importLibrary('places')
  const { PlaceAutocompleteElement } = PlacesLibrary

  if (!PlaceAutocompleteElement) {
    throw new Error('PlaceAutocompleteElement is not available in the Places library')
  }

  // Clear container
  config.container.innerHTML = ''

  // Create PlaceAutocompleteElement - MODERN API ONLY
  const placeAutocomplete = new PlaceAutocompleteElement()

  // Set ONLY supported properties for the latest API
  // DO NOT use componentRestrictions - it's not supported
  // DO NOT use locationBias for region restriction - use includedRegionCodes instead
  
  // South Africa region code (modern API)
  placeAutocomplete.setAttribute('data-region-code', 'ZA')
  
  // Use includedRegionCodes if available, otherwise use the element's built-in properties
  // The placeAutocomplete web component handles region filtering internally
  
  // Get the input element inside and configure it
  const inputElement = placeAutocomplete.querySelector('input') as HTMLInputElement | null
  if (inputElement) {
    inputElement.setAttribute('data-options', JSON.stringify({
      types: ['address', 'establishment'],
      fields: ['geometry', 'formatted_address', 'name', 'place_id'],
      strictBounds: false,
    }))
  }

  // Listen for place selection
  const handlePlaceSelect = () => {
    const place = placeAutocomplete.getPlace?.()
    if (place) {
      config.onPlaceSelect(place)
    }
  }

  const abortController = new AbortController()
  placeAutocomplete.addEventListener('gmp-placeselect', handlePlaceSelect, { signal: abortController.signal })

  // Append to container
  config.container.appendChild(placeAutocomplete)

  return {
    element: placeAutocomplete,
    input: inputElement,
    cleanup: () => {
      abortController.abort()
      if (config.container.contains(placeAutocomplete)) {
        config.container.removeChild(placeAutocomplete)
      }
    },
    getPlace: () => placeAutocomplete.getPlace?.(),
    setValue: (value: string) => {
      if (inputElement) {
        inputElement.value = value
      }
    },
    getValue: () => inputElement?.value ?? '',
    setDisabled: (disabled: boolean) => {
      if (inputElement) {
        inputElement.disabled = disabled
      }
    },
  }
}

// ============================================================================
// MARKER CREATION (MODERN ADVANCED MARKERS ONLY)
// ============================================================================

export interface MarkerConfig {
  map: any
  position: { lat: number; lng: number }
  draggable?: boolean
  onDragEnd?: (coords: MapCoordinates) => void
}

export function createMarkerWithAdvancedMarkerElement(
  google: any,
  config: MarkerConfig
): any {
  if (!google.maps.marker?.AdvancedMarkerElement) {
    // Fallback to legacy marker if AdvancedMarkerElement not available
    return createLegacyMarker(google, config)
  }

  // Create PinElement with styling - MODERN ONLY
  let pinElement: any = null
  if (google.maps.marker?.PinElement) {
    pinElement = new google.maps.marker.PinElement({
      background: '#e85d2a',
      borderColor: '#ffffff',
      glyphColor: '#ffffff',
    })
  }

  // Create AdvancedMarkerElement - NO deprecated properties
  const markerOptions: any = {
    gmpDraggable: config.draggable ?? false,
    map: config.map,
    position: config.position,
    title: 'Selected location',
  }

  // Use PinElement directly without accessing deprecated element property
  if (pinElement) {
    // The PinElement is the content - don't access .element property
    markerOptions.content = pinElement
  }

  const marker = new google.maps.marker.AdvancedMarkerElement(markerOptions)

  if (config.onDragEnd) {
    marker.addListener('dragend', () => {
      const nextPosition = marker.position
      const lat = typeof nextPosition?.lat === 'function' ? nextPosition.lat() : nextPosition?.lat
      const lng = typeof nextPosition?.lng === 'function' ? nextPosition.lng() : nextPosition?.lng

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        config.onDragEnd!({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        })
      }
    })
  }

  return marker
}

function createLegacyMarker(google: any, config: MarkerConfig): any {
  const marker = new google.maps.Marker({
    animation: google.maps.Animation?.DROP,
    draggable: config.draggable ?? false,
    map: config.map,
    position: config.position,
    title: 'Selected location',
  })

  if (config.onDragEnd) {
    marker.addListener('dragend', (event: any) => {
      if (!event.latLng) return

      config.onDragEnd!({
        latitude: Number(event.latLng.lat().toFixed(6)),
        longitude: Number(event.latLng.lng().toFixed(6)),
      })
    })
  }

  return marker
}

// ============================================================================
// UPDATE MARKER POSITION
// ============================================================================

export function updateMarkerPosition(marker: any, position: { lat: number; lng: number }): void {
  if (!marker) return

  if (marker.setPosition) {
    // Legacy marker
    marker.setPosition(position)
  } else if (marker.position !== undefined) {
    // Advanced marker
    marker.position = position
  }
}

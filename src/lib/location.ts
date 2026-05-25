export interface StoredLocation {
  address: string | null
  accuracy: number | null
  latitude: number
  longitude: number
  savedAt: string
}

export interface BrowserLocationHelp {
  platform: 'chrome' | 'safari-ios' | 'android' | 'generic'
  title: string
  steps: string[]
}

const LAST_LOCATION_KEY = 'renta-kasi:last-location'

export const JOHANNESBURG_COORDS = {
  latitude: -26.2041,
  longitude: 28.0473,
}

export function getBrowserLocationHelp(): BrowserLocationHelp {
  if (typeof navigator === 'undefined') {
    return getGenericHelp()
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isAndroid = userAgent.includes('android')
  const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent)
  const isChrome = /chrome|crios|edg/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !isChrome

  if (isAndroid) {
    return {
      platform: 'android',
      title: 'Allow location on Android',
      steps: ['Open Settings', 'Go to Apps > Browser', 'Open Permissions', 'Allow Location'],
    }
  }

  if (isIphoneOrIpad || isSafari) {
    return {
      platform: 'safari-ios',
      title: 'Allow location on Safari',
      steps: ['Open Settings', 'Go to Safari', 'Open Location', 'Allow location access'],
    }
  }

  if (isChrome) {
    return {
      platform: 'chrome',
      title: 'Allow location in Chrome',
      steps: ['Click the lock icon near the URL', 'Open Site settings', 'Set Location to Allow'],
    }
  }

  return getGenericHelp()
}

export function readLastLocation(): StoredLocation | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(LAST_LOCATION_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as StoredLocation
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null

    return parsed
  } catch {
    return null
  }
}

export function saveLastLocation(location: Omit<StoredLocation, 'savedAt'>) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      LAST_LOCATION_KEY,
      JSON.stringify({
        ...location,
        savedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // Location storage is only a convenience; private browsing or storage limits should not block the flow.
  }
}

export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    accept_language: 'en',
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) return null

  const result = (await response.json()) as { display_name?: string }
  return result.display_name ?? null
}

function getGenericHelp(): BrowserLocationHelp {
  return {
    platform: 'generic',
    title: 'Allow location in your browser',
    steps: ['Open your browser site settings', 'Find Location permissions', 'Allow location for this site'],
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { readLastLocation, reverseGeocode, saveLastLocation, type StoredLocation } from '@/lib/location'

export type GeolocationStatus = 'idle' | 'checking' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'blocked' | 'unavailable' | 'timeout' | 'error'
export type GeolocationPermission = PermissionState | 'unsupported' | 'unknown'

export interface GeolocationCoords {
  accuracy: number | null
  latitude: number
  longitude: number
}

export interface GeolocationResult {
  address: string | null
  coords: GeolocationCoords
}

interface GeolocationState {
  address: string | null
  coords: GeolocationCoords | null
  error: string | null
  lastLocation: StoredLocation | null
  permission: GeolocationPermission
  status: GeolocationStatus
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2 * 60 * 1000,
  timeout: 12000,
}

function getFriendlyError(error: GeolocationPositionError): Pick<GeolocationState, 'error' | 'status'> {
  // Geolocation can fail because the user denied access, the site is not on HTTPS,
  // a Permissions-Policy header blocks it, or the device cannot get a reliable fix.
  if (error.code === error.PERMISSION_DENIED) {
    const isPolicyBlocked = /permissions policy|blocked|disabled/i.test(error.message)

    return {
      status: isPolicyBlocked ? 'blocked' : 'denied',
      error: isPolicyBlocked ? 'Location is not available for this page right now.' : 'Location access is turned off for this site.',
    }
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return {
      status: 'unavailable',
      error: 'We could not find a reliable location signal.',
    }
  }

  if (error.code === error.TIMEOUT) {
    return {
      status: 'timeout',
      error: 'Location detection is taking longer than expected.',
    }
  }

  return {
    status: 'error',
    error: 'Location could not be detected.',
  }
}

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as GeolocationPositionError).code === 'number'
  )
}

function isGeolocationReady() {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return false
  if (typeof window === 'undefined') return true

  return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

async function getPermissionState(): Promise<GeolocationPermission> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator) || !navigator.permissions?.query) {
    return 'unsupported'
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    return permission.state
  } catch {
    return 'unknown'
  }
}

export function useGeolocation({ autoRequestIfGranted = false }: { autoRequestIfGranted?: boolean } = {}) {
  const [state, setState] = useState<GeolocationState>({
    address: null,
    coords: null,
    error: null,
    lastLocation: readLastLocation(),
    permission: 'unknown',
    status: 'idle',
  })
  const hasAutoRequestedRef = useRef(false)
  const isRequestingRef = useRef(false)

  const checkPermission = useCallback(async () => {
    if (!isGeolocationReady()) {
      const isSecureIssue = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

      setState((current) => ({
        ...current,
        error: isSecureIssue ? 'Location needs a secure HTTPS connection.' : 'This browser does not support location detection.',
        permission: 'unsupported',
        status: 'unsupported',
      }))
      return 'unsupported' as const
    }

    setState((current) => ({ ...current, error: null, status: current.status === 'requesting' ? current.status : 'checking' }))

    const permission = await getPermissionState()
    setState((current) => ({
      ...current,
      error: null,
      permission,
      status: permission === 'prompt' ? 'prompt' : current.status === 'checking' ? 'idle' : current.status,
    }))

    return permission
  }, [])

  const requestLocation = useCallback(async () => {
    if (isRequestingRef.current) return null

    const permission = await checkPermission()
    if (permission === 'denied' || (permission === 'unsupported' && !isGeolocationReady())) {
      setState((current) => ({
        ...current,
        error: permission === 'denied' ? 'Location access is turned off for this site.' : current.error,
        permission,
        status: permission === 'denied' ? 'denied' : 'unsupported',
      }))
      return null
    }

    isRequestingRef.current = true
    setState((current) => ({ ...current, error: null, status: 'requesting' }))

    try {
      const coords = await new Promise<GeolocationCoords>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
              latitude: Number(position.coords.latitude.toFixed(6)),
              longitude: Number(position.coords.longitude.toFixed(6)),
            })
          },
          reject,
          GEOLOCATION_OPTIONS,
        )
      })

      let address: string | null = null

      try {
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 6000)
        try {
          address = await reverseGeocode(coords.latitude, coords.longitude, controller.signal)
        } finally {
          window.clearTimeout(timeout)
        }
      } catch {
        // Reverse geocoding is a progressive enhancement. The coordinates remain usable without it.
      }

      const lastLocation = {
        accuracy: coords.accuracy,
        address,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }

      saveLastLocation(lastLocation)
      setState({ address, coords, error: null, lastLocation: { ...lastLocation, savedAt: new Date().toISOString() }, permission: 'granted', status: 'granted' })
      return { address, coords }
    } catch (error) {
      const fallback =
        isGeolocationPositionError(error)
          ? getFriendlyError(error)
          : {
              status: 'error' as const,
              error: 'Location could not be detected.',
            }

      setState((current) => ({ ...current, coords: null, ...fallback }))
      return null
    } finally {
      isRequestingRef.current = false
    }
  }, [checkPermission])

  const resetLocationError = useCallback(() => {
    setState((current) => ({ ...current, error: null, status: current.status === 'granted' ? current.status : 'idle' }))
  }, [])

  useEffect(() => {
    checkPermission().then((permission) => {
      // Best practice: never trigger a new browser prompt on page load. If the user already granted
      // permission earlier, fetching automatically is safe and keeps location-based flows fast.
      if (autoRequestIfGranted && permission === 'granted' && !hasAutoRequestedRef.current) {
        hasAutoRequestedRef.current = true
        void requestLocation()
      }
    })
  }, [autoRequestIfGranted, checkPermission, requestLocation])

  return {
    ...state,
    checkPermission,
    isChecking: state.status === 'checking',
    isRequesting: state.status === 'requesting',
    requestLocation,
    resetLocationError,
  }
}

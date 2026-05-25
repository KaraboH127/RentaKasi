import { useEffect, useState } from 'react'
import { hasGoogleMapsApiKey, importGoogleMapsLibraries } from '@/lib/google-maps'

type GoogleMapsStatus = 'idle' | 'missing-key' | 'loading' | 'ready' | 'error'

export function useGoogleMaps() {
  const [googleMaps, setGoogleMaps] = useState<any | null>(null)
  const [status, setStatus] = useState<GoogleMapsStatus>(() => (hasGoogleMapsApiKey() ? 'idle' : 'missing-key'))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) {
      setStatus('missing-key')
      setError('Google Maps API key is not configured.')
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(null)

    importGoogleMapsLibraries()
      .then((google) => {
        if (cancelled) return
        setGoogleMaps(google)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Google Maps failed to initialize.')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    error,
    googleMaps,
    isReady: status === 'ready',
    isLoading: status === 'idle' || status === 'loading',
    status,
  }
}

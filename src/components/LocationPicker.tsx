import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Crosshair, LocateFixed, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationAccessFallback } from '@/components/LocationAccessFallback'
import { useGeolocation, type GeolocationCoords } from '@/hooks/use-geolocation'
import { JOHANNESBURG_COORDS } from '@/lib/location'

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
  onAddressDetected?: (address: string) => void
  onChange: (coords: { latitude: number | null; longitude: number | null }) => void
}

const MAP_LAT_SPAN = 0.03
const MAP_LNG_SPAN = 0.03

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPinPosition(latitude: number | null, longitude: number | null, center: { latitude: number; longitude: number }) {
  if (latitude === null || longitude === null) return { left: '50%', top: '50%' }

  return {
    left: `${clamp(50 + ((longitude - center.longitude) / MAP_LNG_SPAN) * 100, 8, 92)}%`,
    top: `${clamp(50 - ((latitude - center.latitude) / MAP_LAT_SPAN) * 100, 8, 92)}%`,
  }
}

export function LocationPicker({ latitude, longitude, onAddressDetected, onChange }: LocationPickerProps) {
  const hasPin = latitude !== null && longitude !== null
  const latitudeInputRef = useRef<HTMLInputElement>(null)
  const hasAppliedGrantedLocationRef = useRef(false)
  const [isDropMode, setIsDropMode] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null)
  const { address, coords, error, isRequesting, lastLocation, requestLocation, resetLocationError, status } = useGeolocation({ autoRequestIfGranted: true })

  const center = useMemo(() => {
    if (mapCenter) return mapCenter
    if (hasPin) return { latitude, longitude }
    if (lastLocation) return { latitude: lastLocation.latitude, longitude: lastLocation.longitude }
    return JOHANNESBURG_COORDS
  }, [hasPin, lastLocation, latitude, longitude, mapCenter])

  const pinPosition = getPinPosition(latitude, longitude, center)
  // The fallback appears only after a real failure state, keeping the first request calm and optional.
  const shouldShowFallback = ['denied', 'blocked', 'unavailable', 'timeout', 'unsupported', 'error'].includes(status)
  const detectedAddress = address ?? lastLocation?.address

  // Successful browser location, manual coordinates, and saved pins all flow through one updater.
  const applyLocation = (coords: GeolocationCoords, detectedLocationAddress?: string | null) => {
    resetLocationError()
    setMapCenter({ latitude: coords.latitude, longitude: coords.longitude })
    onChange({ latitude: coords.latitude, longitude: coords.longitude })

    if (detectedLocationAddress) {
      onAddressDetected?.(detectedLocationAddress)
    }
  }

  const useCurrentLocation = async () => {
    const result = await requestLocation()

    if (result) {
      applyLocation(result.coords, result.address)
      setIsDropMode(false)
    }
  }

  useEffect(() => {
    if (!coords || status !== 'granted' || hasPin || hasAppliedGrantedLocationRef.current) return

    hasAppliedGrantedLocationRef.current = true
    applyLocation(coords, address)
  }, [address, coords, hasPin, status])

  const useLastLocation = () => {
    if (!lastLocation) return

    applyLocation({
      accuracy: lastLocation.accuracy,
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
    }, lastLocation.address)
  }

  const handleMapClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!isDropMode) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    const nextLatitude = Number((center.latitude + (0.5 - y) * MAP_LAT_SPAN).toFixed(6))
    const nextLongitude = Number((center.longitude + (x - 0.5) * MAP_LNG_SPAN).toFixed(6))

    resetLocationError()
    onChange({ latitude: nextLatitude, longitude: nextLongitude })
  }

  const handleManualLatitudeChange = (value: string) => {
    resetLocationError()
    onChange({ latitude: value ? Number(value) : null, longitude })
  }

  const handleManualLongitudeChange = (value: string) => {
    resetLocationError()
    onChange({ latitude, longitude: value ? Number(value) : null })
  }

  const focusManualEntry = () => {
    resetLocationError()
    latitudeInputRef.current?.focus()
  }

  return (
    <div className="rk-surface overflow-hidden rounded-2xl">
      <button
        type="button"
        className="rk-focus relative h-56 w-full overflow-hidden bg-[linear-gradient(135deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(225deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(315deg,hsl(var(--muted))_25%,hsl(var(--background))_25%)] bg-[length:28px_28px] bg-[position:14px_0,14px_0,0_0,0_0] text-left touch-manipulation"
        onClick={handleMapClick}
        aria-label={isDropMode ? 'Drop location pin on map' : 'Location preview map'}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
        <div className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm">
          {isDropMode ? 'Tap the map to place the pin' : hasPin ? 'Map centered on selected location' : 'No pin selected yet'}
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
        </div>
        <div className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center transition-all duration-300 ease-out" style={pinPosition}>
          <MapPin className="h-10 w-10 fill-primary text-primary drop-shadow-sm" />
          <span className="mt-1 rounded-full bg-card px-2 py-1 text-[11px] font-semibold shadow-sm">
            {hasPin ? 'Pinned location' : 'Add exact pin'}
          </span>
        </div>
      </button>

      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="sm:col-span-3">
          <p className="text-sm font-medium">Use location for a more accurate property pin.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Location is optional. If access is unavailable, landlords can enter coordinates manually or drop the pin on the map.
          </p>
        </div>

        {shouldShowFallback && (
          <LocationAccessFallback
            className="sm:col-span-3"
            isRetrying={isRequesting}
            onDropPin={() => setIsDropMode(true)}
            onEnterManually={focusManualEntry}
            onRetry={useCurrentLocation}
            reason={error}
          />
        )}

        <label className="text-sm font-medium">
          Latitude
          <input
            ref={latitudeInputRef}
            type="number"
            step="0.000001"
            value={latitude ?? ''}
            onChange={(event) => handleManualLatitudeChange(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="-26.2041"
          />
        </label>
        <label className="text-sm font-medium">
          Longitude
          <input
            type="number"
            step="0.000001"
            value={longitude ?? ''}
            onChange={(event) => handleManualLongitudeChange(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="28.0473"
          />
        </label>
        <div className="grid gap-2 self-end">
          <Button type="button" variant="outline" className="h-11 gap-2 touch-manipulation" onClick={useCurrentLocation} disabled={isRequesting} aria-live="polite">
            {isRequesting ? <LocateFixed className="h-4 w-4 animate-pulse" /> : <Crosshair className="h-4 w-4" />}
            {isRequesting ? 'Finding...' : 'Use my location'}
          </Button>
          {lastLocation && (
            <Button type="button" variant="ghost" className="h-9 gap-2 text-xs text-muted-foreground" onClick={useLastLocation}>
              Use last saved pin
            </Button>
          )}
        </div>

        {detectedAddress && (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:col-span-3" role="status">
            Suggested address: {detectedAddress}
          </p>
        )}
        {status === 'granted' && hasPin && (
          <p className="text-xs text-muted-foreground sm:col-span-3" role="status">
            Location added. Check the pin and adjust the coordinates if needed.
          </p>
        )}
      </div>
    </div>
  )
}

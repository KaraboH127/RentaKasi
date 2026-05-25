import { useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, LocateFixed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationPermissionModal } from '@/components/LocationPermissionModal'
import { LocationSearch } from '@/components/LocationSearch'
import { MapView } from '@/components/MapView'
import { useGeolocation, type GeolocationCoords } from '@/hooks/use-geolocation'
import { type ResolvedMapLocation } from '@/lib/google-maps'

interface LocationPickerProps {
  address?: string
  latitude: number | null
  longitude: number | null
  onAddressChange?: (address: string) => void
  onAddressDetected?: (address: string) => void
  onChange: (coords: { latitude: number | null; longitude: number | null }) => void
}

export function LocationPicker({ address = '', latitude, longitude, onAddressChange, onAddressDetected, onChange }: LocationPickerProps) {
  const hasPin = latitude !== null && longitude !== null
  const addressInputRef = useRef<HTMLInputElement>(null)
  const latitudeInputRef = useRef<HTMLInputElement>(null)
  const hasAppliedGrantedLocationRef = useRef(false)
  const [isDropMode, setIsDropMode] = useState(false)
  const [searchAddress, setSearchAddress] = useState(address)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const { address: detectedAddress, coords, error, isRequesting, lastLocation, requestLocation, resetLocationError, status } = useGeolocation({ autoRequestIfGranted: true })

  useEffect(() => {
    setSearchAddress(address)
  }, [address])

  const selectedLocation = useMemo<ResolvedMapLocation | null>(() => {
    if (!hasPin) return null

    return {
      address: searchAddress || detectedAddress || null,
      latitude,
      longitude,
    }
  }, [detectedAddress, hasPin, latitude, longitude, searchAddress])

  const shouldShowFallback = ['denied', 'blocked', 'unavailable', 'timeout', 'unsupported', 'error'].includes(status)

  const syncAddress = (nextAddress: string | null | undefined) => {
    if (!nextAddress) return
    setSearchAddress(nextAddress)
    onAddressChange?.(nextAddress)
    onAddressDetected?.(nextAddress)
  }

  const applyLocation = (location: ResolvedMapLocation | GeolocationCoords, nextAddress?: string | null) => {
    resetLocationError()
    setConfirmation('Location selected successfully')
    onChange({ latitude: location.latitude, longitude: location.longitude })
    syncAddress('address' in location ? location.address : nextAddress)
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
    applyLocation(coords, detectedAddress)
  }, [coords, detectedAddress, hasPin, status])

  const useLastLocation = () => {
    if (!lastLocation) return

    applyLocation({
      address: lastLocation.address,
      latitude: lastLocation.latitude,
      longitude: lastLocation.longitude,
    })
  }

  const handleManualLatitudeChange = (value: string) => {
    resetLocationError()
    setConfirmation(null)
    onChange({ latitude: value ? Number(value) : null, longitude })
  }

  const handleManualLongitudeChange = (value: string) => {
    resetLocationError()
    setConfirmation(null)
    onChange({ latitude, longitude: value ? Number(value) : null })
  }

  const focusManualAddress = () => {
    resetLocationError()
    addressInputRef.current?.focus()
  }

  return (
    <div className="grid gap-4">
      <div className="rk-surface overflow-hidden rounded-2xl">
        <div className="grid gap-4 p-4">
          <div>
            <p className="text-sm font-medium">Search, detect, or drop the exact property pin.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Google Maps is optimized for South African addresses and nearby landmarks. The map updates automatically after address search or GPS detection.
            </p>
          </div>

          <LocationSearch
            ref={addressInputRef}
            value={searchAddress}
            onValueChange={(value) => {
              setSearchAddress(value)
              onAddressChange?.(value)
              setConfirmation(null)
            }}
            onLocationSelect={(location) => {
              applyLocation(location)
              setIsDropMode(false)
            }}
          />

          <MapView
            allowDropPin
            isDropMode={isDropMode}
            onDropModeChange={setIsDropMode}
            onLocationChange={(location) => applyLocation(location)}
            onUseCurrentLocation={useCurrentLocation}
            selectedLocation={selectedLocation}
          />

          {shouldShowFallback && (
            <LocationPermissionModal
              isRetrying={isRequesting}
              onDropPin={() => setIsDropMode(true)}
              onEnterManually={focusManualAddress}
              onRetry={useCurrentLocation}
              reason={error}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
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
          </div>

          {(confirmation || detectedAddress) && (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground" role="status">
              {confirmation ?? 'Suggested address'}{detectedAddress && !confirmation ? `: ${detectedAddress}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

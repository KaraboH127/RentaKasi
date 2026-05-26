import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { MapSkeletonLoader } from '@/components/MapSkeletonLoader'
import { Button } from '@/components/ui/button'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import {
  getDefaultMapCenter,
  getGoogleMapsMapId,
  getSouthAfricaBounds,
  reverseGeocodeGoogle,
  toGoogleLatLng,
  createMarkerWithAdvancedMarkerElement,
  updateMarkerPosition,
  importGoogleMapsLibraries,
  type MapCoordinates,
  type ResolvedMapLocation,
} from '@/lib/location-engine'
import { cn } from '@/lib/utils'
import { readLastLocation } from '@/lib/location'

interface MapViewProps {
  allowDropPin?: boolean
  center?: MapCoordinates | null
  className?: string
  isDropMode?: boolean
  onDropModeChange?: (enabled: boolean) => void
  onLocationChange: (location: ResolvedMapLocation) => void
  onUseCurrentLocation?: () => void
  selectedLocation?: ResolvedMapLocation | null
}

const FALLBACK_LAT_SPAN = 0.03
const FALLBACK_LNG_SPAN = 0.03

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function MapView({ allowDropPin = true, center, className, isDropMode = false, onDropModeChange, onLocationChange, onUseCurrentLocation, selectedLocation }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const currentLocationRef = useRef<ResolvedMapLocation | null>(selectedLocation ?? null)
  const dropModeRef = useRef(isDropMode)
  const { error, googleMaps, isLoading, isReady, status } = useGoogleMaps()

  const restoredCenter = useMemo(() => {
    const lastLocation = readLastLocation()
    return getDefaultMapCenter(lastLocation ? { latitude: lastLocation.latitude, longitude: lastLocation.longitude } : null)
  }, [])
  const mapCenter = center ?? selectedLocation ?? restoredCenter

  const updateMarker = useCallback((location: ResolvedMapLocation, animate = true) => {
    if (!googleMaps || !mapRef.current) return

    const position = toGoogleLatLng(location)
    currentLocationRef.current = location

    // Keep a single marker instance alive; moving it is smoother and avoids marker buildup on repeated searches.
    if (!markerRef.current) {
      markerRef.current = createMarker(googleMaps, mapRef.current, position, allowDropPin, async (coords) => {
        const resolved = await reverseGeocodeGoogle(coords).catch(() => ({ ...coords, address: null, placeId: null }))
        onLocationChange({ ...coords, address: resolved?.address ?? null, placeId: resolved?.placeId ?? null })
      })
    } else {
      // Use Location Engine's updateMarkerPosition for proper handling
      updateMarkerPosition(markerRef.current, position)
    }

    // Production location apps should animate to the chosen point instead of requiring users to move the map.
    mapRef.current.panTo(position)
    if (animate) {
      window.setTimeout(() => mapRef.current?.setZoom(Math.max(mapRef.current.getZoom() ?? 14, 17)), 180)
    } else {
      mapRef.current.setZoom(selectedLocation ? 17 : 11)
    }
  }, [allowDropPin, googleMaps, onLocationChange, selectedLocation])

  useEffect(() => {
    if (!isReady || !googleMaps || !containerRef.current || mapRef.current) return

    // The map is initialized once and then controlled imperatively via refs to prevent expensive React rerenders.
    mapRef.current = new googleMaps.maps.Map(containerRef.current, {
      center: toGoogleLatLng(mapCenter),
      clickableIcons: false,
      controlSize: 32,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      mapId: getGoogleMapsMapId(),
      mapTypeControl: false,
      restriction: {
        latLngBounds: getSouthAfricaBounds(googleMaps),
        strictBounds: false,
      },
      streetViewControl: false,
      zoom: selectedLocation ? 17 : 11,
      zoomControl: true,
    })

    mapRef.current.addListener('click', async (event: any) => {
      if (!allowDropPin || !dropModeRef.current || !event.latLng) return

      const coords = {
        latitude: Number(event.latLng.lat().toFixed(6)),
        longitude: Number(event.latLng.lng().toFixed(6)),
      }
      const resolved = await reverseGeocodeGoogle(coords).catch(() => ({ ...coords, address: null, placeId: null }))
      onDropModeChange?.(false)
      onLocationChange({ ...coords, address: resolved?.address ?? null, placeId: resolved?.placeId ?? null })
    })
  }, [allowDropPin, googleMaps, isReady, mapCenter, onDropModeChange, onLocationChange, selectedLocation])

  useEffect(() => {
    dropModeRef.current = isDropMode
  }, [isDropMode])

  useEffect(() => {
    if (!selectedLocation || !isReady) return
    updateMarker(selectedLocation)
  }, [isReady, selectedLocation, updateMarker])

  if (isLoading) return <MapSkeletonLoader />

  if (!isReady) {
    return (
      <FallbackMap
        center={mapCenter}
        className={className}
        error={status === 'missing-key' ? 'Google Maps API key is not configured yet.' : error}
        isDropMode={isDropMode}
        onDrop={(coords) => onLocationChange({ ...coords, address: null })}
        onDropModeChange={onDropModeChange}
        onUseCurrentLocation={onUseCurrentLocation}
        selectedLocation={selectedLocation}
      />
    )
  }

  return (
    <div className={cn('rk-surface overflow-hidden rounded-2xl', className)}>
      <div className="relative h-[340px] sm:h-[420px]">
        <div ref={containerRef} className="h-full w-full" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          {selectedLocation ? 'Location selected successfully' : isDropMode ? 'Tap the map to drop a pin' : 'Search or use your location'}
        </div>
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          {onUseCurrentLocation && (
            <Button type="button" size="sm" variant="secondary" className="gap-2 shadow-lg" onClick={onUseCurrentLocation}>
              <LocateFixed className="h-4 w-4" />
              Current
            </Button>
          )}
          {allowDropPin && (
            <Button type="button" size="sm" variant={isDropMode ? 'default' : 'outline'} className="gap-2 bg-card/95 shadow-lg backdrop-blur" onClick={() => onDropModeChange?.(!isDropMode)}>
              <MapPin className="h-4 w-4" />
              Drop pin
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function FallbackMap({ center, className, error, isDropMode, onDrop, onDropModeChange, onUseCurrentLocation, selectedLocation }: {
  center: MapCoordinates
  className?: string
  error?: string | null
  isDropMode: boolean
  onDrop: (coords: MapCoordinates) => void
  onDropModeChange?: (enabled: boolean) => void
  onUseCurrentLocation?: () => void
  selectedLocation?: ResolvedMapLocation | null
}) {
  const pin = selectedLocation ? {
    left: `${clamp(50 + ((selectedLocation.longitude - center.longitude) / FALLBACK_LNG_SPAN) * 100, 8, 92)}%`,
    top: `${clamp(50 - ((selectedLocation.latitude - center.latitude) / FALLBACK_LAT_SPAN) * 100, 8, 92)}%`,
  } : { left: '50%', top: '50%' }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!isDropMode) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height

    onDropModeChange?.(false)
    onDrop({
      latitude: Number((center.latitude + (0.5 - y) * FALLBACK_LAT_SPAN).toFixed(6)),
      longitude: Number((center.longitude + (x - 0.5) * FALLBACK_LNG_SPAN).toFixed(6)),
    })
  }

  return (
    <div className={cn('rk-surface overflow-hidden rounded-2xl', className)}>
      <button
        type="button"
        className="rk-focus relative h-[340px] w-full overflow-hidden bg-[linear-gradient(135deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(225deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(315deg,hsl(var(--muted))_25%,hsl(var(--background))_25%)] bg-[length:28px_28px] text-left sm:h-[420px]"
        onClick={handleClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
        <div className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm">
          {isDropMode ? 'Tap the map to place the pin' : selectedLocation ? 'Location selected successfully' : 'Google Maps fallback'}
        </div>
        {error && <div className="absolute left-3 right-3 top-12 rounded-xl border bg-card/95 p-3 text-xs text-muted-foreground shadow-sm">{error}</div>}
        <div className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center transition-all duration-300 ease-out" style={pin}>
          <MapPin className="h-10 w-10 fill-primary text-primary drop-shadow-sm" />
          <span className="rounded-full bg-card px-2 py-1 text-[11px] font-semibold shadow-sm">Pin</span>
        </div>
      </button>
      <div className="flex flex-wrap gap-2 border-t p-3">
        {onUseCurrentLocation && <Button type="button" size="sm" variant="secondary" onClick={onUseCurrentLocation}>Use current location</Button>}
        <Button type="button" size="sm" variant={isDropMode ? 'default' : 'outline'} onClick={() => onDropModeChange?.(!isDropMode)}>Drop pin manually</Button>
      </div>
    </div>
  )
}

function createMarker(googleMaps: any, map: any, position: { lat: number; lng: number }, draggable: boolean, onDragEnd: (coords: MapCoordinates) => void) {
  return createMarkerWithAdvancedMarkerElement(googleMaps, {
    map,
    position,
    draggable,
    onDragEnd,
  })
}

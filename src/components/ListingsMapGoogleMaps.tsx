/**
 * ListingsMap Component
 * 
 * Displays multiple listings on a real Google Map with marker clustering.
 * Features:
 * - Real Google Map with premium styling
 * - Marker creation and clustering
 * - Bidirectional sync with listing cards (click marker ↔ click card)
 * - Auto-fit bounds
 * - Responsive design
 * - Performance optimized for 100+ listings
 * - Mobile-first responsive
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapPin, LocateFixed, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapSkeletonLoader } from '@/components/MapSkeletonLoader'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { useMapContainer } from '@/hooks/use-map-container'
import { useMarkerClusterer } from '@/hooks/use-marker-clusterer'
import { useMapSynchronizer } from '@/hooks/use-map-synchronizer'
import { getDefaultMapCenter, reverseGeocodeGoogle, type MapCoordinates } from '@/lib/location-engine'
import { readLastLocation } from '@/lib/location'
import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/listings'

interface ListingsMapProps {
  listings: Listing[]
  selectedListingId?: string | null
  onListingHover?: (id: string | null) => void
  onListingClick?: (id: string) => void
  className?: string
  compact?: boolean
}

export function ListingsMap({
  listings,
  selectedListingId = null,
  onListingHover,
  onListingClick,
  className,
  compact = false,
}: ListingsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { googleMaps, isReady } = useGoogleMaps()
  const [isLoading, setIsLoading] = useState(!isReady)
  const [error, setError] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(11)

  // Get initial center from last location or default
  const initialCenter = useMemo(() => {
    const lastLocation = readLastLocation()
    return getDefaultMapCenter(lastLocation ? { latitude: lastLocation.latitude, longitude: lastLocation.longitude } : null)
  }, [])

  // Filter listings with coordinates
  const mappedListings = useMemo(() => listings.filter((l) => l.latitude !== null && l.longitude !== null), [listings])

  // Initialize map container
  const { mapRef, isReady: mapReady } = useMapContainer(containerRef as React.RefObject<HTMLDivElement>, {
    center: initialCenter,
    zoom: 11,
    allowFullscreen: !compact,
    disableStreetView: false,
    disableMapType: false,
    clickableIcons: false,
  })

  // Initialize marker clusterer
  const { highlightMarker, removeHighlight } = useMarkerClusterer(mapRef, mappedListings, {
    onMarkerClick: (listing) => {
      onListingClick?.(listing.id)
    },
  })

  // Initialize map synchronizer
  const { panToListing } = useMapSynchronizer(mapRef, selectedListingId, {
    onMarkerClick: (id) => {
      onListingClick?.(id)
    },
    autoZoom: !compact,
  })

  // Auto-fit bounds when listings change
  useEffect(() => {
    if (!mapReady || !mapRef.current || mappedListings.length === 0) return

    try {
      const google = googleMaps
      const bounds = new google.maps.LatLngBounds()

      for (const listing of mappedListings) {
        if (listing.latitude !== null && listing.longitude !== null) {
          bounds.extend({ lat: listing.latitude, lng: listing.longitude })
        }
      }

      mapRef.current.fitBounds(bounds, {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })
    } catch (err) {
      console.error('[ListingsMap] Failed to fit bounds:', err)
    }
  }, [mappedListings, mapReady, mapRef, googleMaps])

  // Handle selected listing - pan and highlight marker
  useEffect(() => {
    if (!selectedListingId || !mapReady) return

    const listing = mappedListings.find((l) => l.id === selectedListingId)
    if (!listing) return

    panToListing(listing)
    highlightMarker(selectedListingId)

    return () => {
      removeHighlight(selectedListingId)
    }
  }, [selectedListingId, mapReady, mappedListings, panToListing, highlightMarker, removeHighlight])

  // Track zoom level
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const zoomListener = mapRef.current.addListener('zoom_changed', () => {
      setZoomLevel(mapRef.current.getZoom())
    })

    return () => {
      zoomListener?.remove?.()
    }
  }, [mapReady, mapRef])

  // Update loading state
  useEffect(() => {
    setIsLoading(!isReady)
  }, [isReady])

  // Handle no listings
  if (mappedListings.length === 0) {
    return (
      <div className={cn('rounded-2xl border bg-muted/50 p-5 text-center', className)}>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card text-muted-foreground">
          <MapPin className="h-5 w-5" />
        </div>
        <p className="font-display font-semibold">No rooms to show on map</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or searching for a different area.</p>
      </div>
    )
  }

  // Show loading skeleton
  if (isLoading) {
    return <MapSkeletonLoader />
  }

  return (
    <div className={cn('rk-surface overflow-hidden rounded-2xl', className)}>
      <div className={cn('relative', compact ? 'h-56' : 'h-[360px]')}>
        {/* Map container */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Overlay: Listing count */}
        <div className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          {mappedListings.length} pinned {mappedListings.length === 1 ? 'room' : 'rooms'}
        </div>

        {/* Overlay: Zoom controls (only on non-compact) */}
        {!compact && (
          <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-xl border bg-card/95 shadow-sm backdrop-blur">
            <button
              type="button"
              className="rk-focus flex h-10 w-10 items-center justify-center border-b transition-colors hover:bg-accent"
              onClick={() => {
                if (mapRef.current) mapRef.current.setZoom(Math.min(21, zoomLevel + 1))
              }}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rk-focus flex h-10 w-10 items-center justify-center border-b transition-colors hover:bg-accent"
              onClick={() => {
                if (mapRef.current) mapRef.current.setZoom(Math.max(0, zoomLevel - 1))
              }}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rk-focus flex h-10 w-10 items-center justify-center transition-colors hover:bg-accent"
              onClick={() => {
                if (mapRef.current) {
                  const bounds = new googleMaps.maps.LatLngBounds()
                  for (const listing of mappedListings) {
                    if (listing.latitude !== null && listing.longitude !== null) {
                      bounds.extend({ lat: listing.latitude, lng: listing.longitude })
                    }
                  }
                  mapRef.current.fitBounds(bounds)
                }
              }}
              aria-label="Reset view"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute left-4 top-14 rounded-xl border bg-card/95 px-4 py-3 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

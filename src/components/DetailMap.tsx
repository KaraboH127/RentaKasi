/**
 * DetailMap Component
 * 
 * Displays a single property location on a real Google Map.
 * Features:
 * - Auto-centered on property
 * - Premium marker styling
 * - Action buttons overlay:
 *   - Open in Google Maps
 *   - Get Directions
 *   - Copy Address
 * - Responsive design
 * - Mobile-friendly
 * - Error handling with fallback
 */

import { useEffect, useRef, useState } from 'react'
import { Copy, MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapSkeletonLoader } from '@/components/MapSkeletonLoader'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { useMapContainer } from '@/hooks/use-map-container'
import { createMarkerWithAdvancedMarkerElement } from '@/lib/location-engine'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/listings'

interface DetailMapProps {
  listing: Listing
  className?: string
}

export function DetailMap({ listing, className }: DetailMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const { googleMaps, isReady } = useGoogleMaps()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(!isReady)
  const [isCopying, setIsCopying] = useState(false)

  // Only show map if listing has coordinates
  const hasCoordinates = listing.latitude !== null && listing.longitude !== null

  // Initialize map container
  const { mapRef } = useMapContainer(containerRef as React.RefObject<HTMLDivElement>, {
    center: hasCoordinates
      ? { latitude: listing.latitude!, longitude: listing.longitude! }
      : { latitude: -26.2041, longitude: 28.0473 }, // Johannesburg fallback
    zoom: 17,
    allowFullscreen: true,
    disableStreetView: false,
    disableMapType: true,
    clickableIcons: true,
  })

  // Create marker on map
  useEffect(() => {
    if (!isReady || !mapRef.current || !hasCoordinates || !googleMaps) return

    try {
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.map = null
      }

      // Create new marker
      markerRef.current = createMarkerWithAdvancedMarkerElement(googleMaps, {
        map: mapRef.current,
        position: { lat: listing.latitude!, lng: listing.longitude! },
        draggable: false,

        onDragEnd: () => {}, // Not draggable on detail view
      })

      // Auto-center on marker
      mapRef.current.panTo({ lat: listing.latitude!, lng: listing.longitude! })
      mapRef.current.setZoom(17)
    } catch (error) {
      console.error('[DetailMap] Failed to create marker:', error)
      toast({
        title: 'Map error',
        description: 'Could not display marker on map.',
        variant: 'destructive',
      })
    }
  }, [isReady, mapRef, hasCoordinates, googleMaps, listing, toast])

  // Handle copy address
  const handleCopyAddress = async () => {
    const address = listing.address || listing.location
    if (!address) return

    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(address)
      toast({
        title: 'Copied',
        description: 'Address copied to clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy address.',
        variant: 'destructive',
      })
    } finally {
      setIsCopying(false)
    }
  }

  // Handle open in Google Maps
  const handleOpenInMaps = () => {
    if (!hasCoordinates) return

    const query = encodeURIComponent(listing.address || listing.location || `${listing.latitude},${listing.longitude}`)
    const url = `https://www.google.com/maps/search/${query}`
    window.open(url, '_blank')
  }

  // Handle get directions
  const handleGetDirections = () => {
    if (!hasCoordinates) return

    const query = encodeURIComponent(listing.address || listing.location || `${listing.latitude},${listing.longitude}`)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`
    window.open(url, '_blank')
  }

  // Update loading state
  useEffect(() => {
    setIsLoading(!isReady)
  }, [isReady])

  if (isLoading) {
    return <MapSkeletonLoader />
  }

  if (!hasCoordinates) {
    return (
      <div className={cn('rounded-2xl border bg-muted/50 p-5 text-center', className)}>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card text-muted-foreground">
          <MapPin className="h-5 w-5" />
        </div>
        <p className="font-display font-semibold">Location not available</p>
        <p className="mt-1 text-sm text-muted-foreground">This listing doesn't have map coordinates yet.</p>
      </div>
    )
  }

  return (
    <div className={cn('rk-surface overflow-hidden rounded-2xl', className)}>
      {/* Map container */}
      <div className="relative h-56 sm:h-80 md:h-96">
        <div ref={containerRef} className="h-full w-full" />

        {/* Overlay: Location name */}
        <div className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          {listing.location}
        </div>

        {/* Overlay: Action buttons */}
        <div className="absolute right-3 top-3 z-30 flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-2 shadow-lg"
            onClick={handleOpenInMaps}
            title="Open in Google Maps"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Maps</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-2 shadow-lg"
            onClick={handleGetDirections}
            title="Get directions"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Directions</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 bg-card/95 shadow-lg backdrop-blur"
            onClick={handleCopyAddress}
            disabled={isCopying}
            title="Copy address"
          >
            {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </div>
      </div>

      {/* Overlay: Address information */}
      <div className="border-t bg-muted/30 p-3 sm:p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{listing.title}</p>
          <p className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{listing.address || listing.location}</span>
          </p>
          {listing.landmark && <p className="text-xs text-muted-foreground pl-5">Landmark: {listing.landmark}</p>}
          {listing.taxiRouteProximity && <p className="text-xs text-muted-foreground pl-5">Taxi route: {listing.taxiRouteProximity}</p>}
        </div>
      </div>
    </div>
  )
}

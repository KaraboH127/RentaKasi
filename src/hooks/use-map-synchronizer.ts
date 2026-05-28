/**
 * useMapSynchronizer Hook
 * 
 * Keeps map state and external state (selected listing) in sync.
 * Handles bidirectional updates between map markers and listing cards.
 */

import { useEffect, useCallback, useRef } from 'react'
import { toGoogleLatLng } from '@/lib/location-engine'

interface MapSynchronizerConfig {
  onMarkerClick?: (listingId: string) => void
  onMapClick?: (latLng: any) => void
  autoZoom?: boolean
}

export function useMapSynchronizer(
  mapRef: React.MutableRefObject<any>,
  selectedListingId: string | null,
  config: MapSynchronizerConfig = {},
) {
  const mapClickListenerRef = useRef<any | null>(null)
  const zoomLevelRef = useRef<number>(11)

  // Pan to and highlight marker when selection changes
  const panToListing = useCallback((listing: any) => {
    if (!mapRef.current || !listing.latitude || !listing.longitude) return

    const position = toGoogleLatLng({
      latitude: listing.latitude,
      longitude: listing.longitude,
    })

    // Pan to position with animation
    mapRef.current.panTo(position)

    // Zoom in if configured
    if (config.autoZoom ?? true) {
      const currentZoom = mapRef.current.getZoom() || 11
      const targetZoom = Math.max(currentZoom, 16)
      mapRef.current.setZoom(targetZoom)
      zoomLevelRef.current = targetZoom
    }
  }, [mapRef, config.autoZoom])

  // Setup map click listener
  useEffect(() => {
    if (!mapRef.current) return

    // Remove old listener
    if (mapClickListenerRef.current) {
      mapClickListenerRef.current.remove()
      mapClickListenerRef.current = null
    }

    // Add new listener
    mapClickListenerRef.current = mapRef.current.addListener('click', (event: any) => {
      config.onMapClick?.(event.latLng)
    })

    return () => {
      if (mapClickListenerRef.current) {
        mapClickListenerRef.current.remove()
        mapClickListenerRef.current = null
      }
    }
  }, [mapRef, config.onMapClick])

  // Store zoom level
  useEffect(() => {
    if (!mapRef.current) return

    const zoomListener = mapRef.current.addListener('zoom_changed', () => {
      zoomLevelRef.current = mapRef.current.getZoom()
    })

    return () => {
      zoomListener?.remove?.()
    }
  }, [mapRef])

  return {
    panToListing,
    getZoomLevel: () => zoomLevelRef.current,
  }
}

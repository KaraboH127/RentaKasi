/**
 * useGoogleMapContainer Hook
 * 
 * Encapsulates Google Map initialization logic.
 * Returns ref and state for imperative map management.
 */

import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { getGoogleMapsMapId, getSouthAfricaBounds, toGoogleLatLng, type MapCoordinates } from '@/lib/location-engine'

export interface MapContainerConfig {
  center: MapCoordinates
  zoom: number
  allowFullscreen?: boolean
  disableStreetView?: boolean
  disableMapType?: boolean
  clickableIcons?: boolean
}

export function useMapContainer(
  containerRef: React.RefObject<HTMLDivElement>,
  config: MapContainerConfig,
) {
  const mapRef = useRef<any | null>(null)
  const { googleMaps, isReady } = useGoogleMaps()

  useEffect(() => {
    if (!isReady || !googleMaps || !containerRef.current || mapRef.current) return

    try {
      mapRef.current = new googleMaps.maps.Map(containerRef.current, {
        center: toGoogleLatLng(config.center),
        zoom: config.zoom,
        clickableIcons: config.clickableIcons ?? false,
        controlSize: 32,
        fullscreenControl: config.allowFullscreen ?? false,
        gestureHandling: 'greedy',
        mapId: getGoogleMapsMapId(),
        mapTypeControl: !config.disableMapType,
        restriction: {
          latLngBounds: getSouthAfricaBounds(googleMaps),
          strictBounds: false,
        },
        streetViewControl: !config.disableStreetView,
        zoomControl: true,
      })
    } catch (error) {
      console.error('[useMapContainer] Failed to initialize map:', error)
    }

    return () => {
      // Keep map alive during component lifetime
      // Cleanup happens when component unmounts
    }
  }, [isReady, googleMaps, containerRef, config])

  return {
    mapRef,
    isReady,
    googleMaps,
  }
}

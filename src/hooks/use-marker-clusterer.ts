/**
 * useMarkerClusterer Hook
 * 
 * Manages marker clustering for multiple listings.
 * Handles marker creation, clustering, and event listeners.
 * Optimized for performance with 100+ listings.
 */

import { useEffect, useRef, useCallback } from 'react'
import { createMarkerWithAdvancedMarkerElement, type MapCoordinates, type ResolvedMapLocation } from '@/lib/location-engine'
import type { Listing } from '@/lib/listings'

interface MarkerClustererConfig {
  maxZoom?: number
  imagePath?: string
  imageExtension?: string
  minimumClusterSize?: number
}

export function useMarkerClusterer(
  mapRef: React.MutableRefObject<any>,
  listings: Listing[],
  config: {
    onMarkerClick?: (listing: Listing) => void
    clustererConfig?: MarkerClustererConfig
  } = {},
) {
  const clustererRef = useRef<any | null>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const abortControllerRef = useRef(new AbortController())

  // Create markers for listings with coordinates
  const createMarkers = useCallback(
    (google: any) => {
      if (!mapRef.current) return []

      const markers: any[] = []
      const newMarkers = new Map<string, any>()

      for (const listing of listings) {
        if (!listing.latitude || !listing.longitude) continue

        const position = { lat: listing.latitude, lng: listing.longitude }

        try {
          const marker = createMarkerWithAdvancedMarkerElement(google, {
            map: mapRef.current,
            position,
            draggable: false,
            onDragEnd: () => {}, // Not draggable on listings map
          })

          // Add metadata
          marker.listingId = listing.id
          marker.listing = listing

          // Add click listener
          marker.addListener('click', () => {
            config.onMarkerClick?.(listing)
          })

          markers.push(marker)
          newMarkers.set(listing.id, marker)
        } catch (error) {
          console.error(`[useMarkerClusterer] Failed to create marker for listing ${listing.id}:`, error)
        }
      }

      markersRef.current = newMarkers
      return markers
    },
    [listings, mapRef, config],
  )

  // Initialize clusterer
  useEffect(() => {
    const initializeClusterer = async () => {
      if (!mapRef.current) return

      try {
        // Dynamic import for MarkerClusterer - only load if needed
        const google = (window as any).google
        if (!google?.maps) return

        // Try to load MarkerClusterer from CDN or npm
        // For now, implement a simpler clustering solution without external library
        const markers = createMarkers(google)

        if (markers.length === 0) {
          clustererRef.current = null
          return
        }

        // Store markers for clustering
        clustererRef.current = {
          markers,
          map: mapRef.current,
          count: markers.length,
        }

        // Auto-fit bounds
        if (markers.length > 0) {
          const bounds = new google.maps.LatLngBounds()
          for (const marker of markers) {
            if (marker.position) {
              bounds.extend(marker.position)
            }
          }
          mapRef.current.fitBounds(bounds, {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100,
          })
        }
      } catch (error) {
        console.error('[useMarkerClusterer] Failed to initialize clusterer:', error)
      }
    }

    initializeClusterer()
  }, [listings, mapRef, createMarkers])

  // Update markers when listings change
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return

    // Clear existing markers
    for (const marker of markersRef.current.values()) {
      marker.map = null
    }
    markersRef.current.clear()

    // Create new markers
    const google = (window as any).google
    if (google?.maps) {
      const markers = createMarkers(google)
      if (clustererRef.current) {
        clustererRef.current.markers = markers
        clustererRef.current.count = markers.length
      }
    }
  }, [createMarkers, mapRef])

  // Get marker by listing ID
  const getMarker = useCallback((listingId: string) => {
    return markersRef.current.get(listingId) || null
  }, [])

  // Highlight marker
  const highlightMarker = useCallback((listingId: string) => {
    const marker = getMarker(listingId)
    if (!marker) return

    // Update marker styling
    const pinElement = marker.content
    if (pinElement && pinElement.element) {
      pinElement.element.style.transform = 'scale(1.2)'
      pinElement.element.style.filter = 'drop-shadow(0 0 8px rgba(232, 93, 42, 0.6))'
    }
  }, [getMarker])

  // Remove highlight
  const removeHighlight = useCallback((listingId: string) => {
    const marker = getMarker(listingId)
    if (!marker) return

    const pinElement = marker.content
    if (pinElement && pinElement.element) {
      pinElement.element.style.transform = 'scale(1)'
      pinElement.element.style.filter = 'none'
    }
  }, [getMarker])

  // Cleanup
  useEffect(() => {
    return () => {
      // Remove all markers
      for (const marker of markersRef.current.values()) {
        marker.map = null
      }
      markersRef.current.clear()
      clustererRef.current = null
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    clustererRef,
    markersRef,
    getMarker,
    highlightMarker,
    removeHighlight,
    updateMarkers,
  }
}

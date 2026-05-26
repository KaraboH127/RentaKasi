/**
 * COMPATIBILITY LAYER
 * 
 * This file re-exports from location-engine.ts for backward compatibility.
 * New code should import directly from location-engine.ts
 * 
 * @deprecated Use location-engine.ts directly
 */

export {
  type MapCoordinates,
  type ResolvedMapLocation,
  getGoogleMapsApiKey,
  getGoogleMapsMapId,
  hasGoogleMapsApiKey,
  loadGoogleMapsApi,
  importGoogleMapsLibraries,
  toGoogleLatLng,
  fromGoogleLatLng,
  getSouthAfricaBounds,
  getSouthAfricaBoundsLiteral,
  geocodeAddress,
  reverseGeocodeGoogle,
  extractPlaceDetails,
  getDefaultMapCenter,
  initializePlaceAutocomplete,
  createMarkerWithAdvancedMarkerElement,
  updateMarkerPosition,
  type PlaceAutocompleteConfig,
  type LocationEngineConfig,
  type MarkerConfig,
} from '@/lib/location-engine'

// Re-export getSouthAfricaBoundsForPlaces for backward compatibility
import { getSouthAfricaBounds } from '@/lib/location-engine'

export function getSouthAfricaBoundsForPlaces(google: any) {
  const bounds = getSouthAfricaBounds(google)
  return {
    north: bounds.getNorthEast().lat(),
    south: bounds.getSouthWest().lat(),
    east: bounds.getNorthEast().lng(),
    west: bounds.getSouthWest().lng(),
  }
}

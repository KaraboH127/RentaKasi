# Google Maps Places Autocomplete Migration Guide

## Overview
This document outlines the migration from the deprecated `google.maps.places.Autocomplete` API to the new `PlaceAutocompleteElement` web component.

## Changes Made

### 1. Updated `src/lib/google-maps.ts`
Added three new helper functions to support the new API:

#### `getSouthAfricaBoundsForPlaces(google)`
Converts the legacy LatLngBounds format to the format required by PlaceAutocompleteElement:
```typescript
export function getSouthAfricaBoundsForPlaces(google: any) {
  const bounds = getSouthAfricaBounds(google)
  return {
    north: bounds.getNorthEast().lat(),
    south: bounds.getSouthWest().lat(),
    east: bounds.getNorthEast().lng(),
    west: bounds.getSouthWest().lng(),
  }
}
```

#### `extractPlaceDetails(place)`
Extracts and normalizes place data from the PlaceAutocompleteElement selection:
- Handles both function and property accessors for lat/lng
- Extracts formatted address, name, and place ID
- Returns standardized `ResolvedMapLocation` format
- Provides null safety with fallback values

#### `getPlacesLibrary()`
Provides access to the Places library with compatibility for both old and new dynamic import syntax:
```typescript
export async function getPlacesLibrary() {
  const google = await loadGoogleMapsApi()
  
  if (google.maps.importLibrary) {
    return google.maps.importLibrary('places')
  }

  return google.maps.places
}
```

### 2. Migrated `src/components/LocationSearch.tsx`
Complete rewrite to use PlaceAutocompleteElement:

#### Key Changes:
- **Web Component Integration**: Uses `PlaceAutocompleteElement` as a web component that provides native autocomplete UI
- **Event Handling**: Replaced `place_changed` listener with `gmp-placeselect` event
- **Dynamic Import**: Loads PlaceAutocompleteElement from the Places library at runtime
- **Custom Styling**: Applies consistent styling to the autocomplete input field
- **Ref Support**: Maintains backward compatibility with `forwardedRef` for parent components
- **Memory Management**: Proper cleanup with `AbortController` to prevent memory leaks and duplicate listeners

#### South Africa Restrictions:
- Uses `locationBias` with `getSouthAfricaBoundsForPlaces()` for location biasing
- Applies `componentRestrictions: { country: 'za' }` for country-level filtering
- Maintains `language: 'en'` setting

#### Preserved Features:
✅ Automatic map pan/zoom (handled by LocationPicker/MapView, not autocomplete)
✅ Automatic marker placement (handled by MapView)
✅ Reverse geocoding (via `reverseGeocodeGoogle()`)
✅ Form autofill (via PlaceAutocompleteElement)
✅ Manual address search fallback (via `geocodeAddress()`)
✅ React + TypeScript compatibility
✅ Mobile responsiveness (web component is mobile-friendly)
✅ Current UX behavior and user messaging

#### New Capabilities:
- **Better Native Integration**: Uses web component with native browser support
- **Improved Performance**: Reduced JavaScript overhead with web component
- **Enhanced Accessibility**: Built-in accessibility features from the web component
- **Future-Proof**: Uses Google's recommended modern API pattern

## Technical Details

### Web Component Initialization
```typescript
const placeAutocomplete = new PlaceAutocompleteElement({
  requestOptions: {
    componentRestrictions: { country: 'za' },
    locationBias: getSouthAfricaBoundsForPlaces(googleMaps),
    language: 'en',
  },
})
```

### Event Handling
```typescript
placeAutocomplete.addEventListener('gmp-placeselect', async () => {
  const place = placeAutocomplete.getPlace?.()
  const location = await extractPlaceDetails(place)
  // Process location...
})
```

### Memory Management
- Uses `AbortController` for proper event listener cleanup
- Prevents duplicate listeners on re-renders
- Ensures no memory leaks in long-lived applications

## Migration Checklist

- [x] Replace deprecated `google.maps.places.Autocomplete`
- [x] Use `google.maps.importLibrary("places")`
- [x] Implement `PlaceAutocompleteElement` web component
- [x] Preserve South Africa restrictions via `locationBias`
- [x] Preserve automatic map pan/zoom behavior
- [x] Preserve automatic marker placement
- [x] Preserve reverse geocoding integration
- [x] Preserve form autofill functionality
- [x] Maintain React + TypeScript compatibility
- [x] Implement proper memory leak prevention
- [x] Ensure no duplicate event listeners
- [x] Maintain mobile responsiveness
- [x] Preserve current UX behavior
- [x] Generate production-ready code
- [x] TypeScript compilation successful (no errors)

## Testing Recommendations

### 1. South Africa Restrictions
- Test that searches outside South Africa are deprioritized
- Verify that South African addresses are prioritized
- Test with coordinates outside SA boundaries

### 2. Automatic Behaviors
- Search for address and verify map pans to location
- Verify zoom level changes appropriately
- Check marker placement is correct
- Verify reverse geocoding enriches location data

### 3. Mobile Responsiveness
- Test on mobile devices
- Verify autocomplete dropdown works on small screens
- Check touch interactions work properly

### 4. Memory & Performance
- Monitor for memory leaks over extended use
- Verify event listeners are properly cleaned up
- Check no duplicate listeners on component re-mounts

### 5. Error Handling
- Test with invalid API key
- Test with network errors
- Verify fallback to manual search works

### 6. User Experience
- Verify all user messages still display
- Test manual address search fallback
- Check keyboard navigation works (Enter key)
- Verify disabled state works correctly

## Browser Compatibility

PlaceAutocompleteElement is supported in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Environment Configuration

Ensure your `.env` file contains:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here (optional)
```

The API key requires the following Google Maps APIs enabled:
- Maps API
- Places API
- Geocoding API

## Rollback Instructions

If issues arise, the original implementation can be restored by reverting to commit before this migration:
```bash
git revert <commit-hash>
```

## References

- [Google Places Library](https://developers.google.com/maps/documentation/javascript/places)
- [PlaceAutocompleteElement Documentation](https://developers.google.com/maps/documentation/js/place-autocomplete-element)
- [Migration Guide](https://developers.google.com/maps/documentation/javascript/migrate-to-webc)

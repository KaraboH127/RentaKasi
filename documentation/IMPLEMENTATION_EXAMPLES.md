# PlaceAutocompleteElement Implementation Examples

## Quick Start

The migrated `LocationSearch` component works exactly like before from a parent component's perspective:

```tsx
import { LocationSearch } from '@/components/LocationSearch'
import { useState } from 'react'

export function MyLocationPicker() {
  const [address, setAddress] = useState('')
  
  const handleLocationSelect = (location) => {
    console.log('Selected location:', location)
    // location.latitude, location.longitude, location.address, location.placeId
  }
  
  return (
    <LocationSearch
      value={address}
      onValueChange={setAddress}
      onLocationSelect={handleLocationSelect}
      placeholder="Search for an address..."
    />
  )
}
```

## Component Props

```typescript
interface LocationSearchProps {
  disabled?: boolean                                    // Disable the search input
  onLocationSelect: (location: ResolvedMapLocation) => void  // Called when place is selected
  onValueChange: (value: string) => void               // Called on input change
  placeholder?: string                                  // Input placeholder text
  value: string                                         // Current search value
}
```

## Location Object Structure

```typescript
interface ResolvedMapLocation {
  latitude: number
  longitude: number
  address: string | null
  placeId?: string | null
}
```

## Integration with LocationPicker

The component integrates seamlessly with `LocationPicker`:

```tsx
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
```

## New API Features

### 1. PlaceAutocompleteElement Event
The component now uses the `gmp-placeselect` event instead of `place_changed`:

```typescript
const placeAutocomplete = new PlaceAutocompleteElement()

// Set configuration properties directly on the element (not in constructor)
placeAutocomplete.componentRestrictions = { country: 'za' }
placeAutocomplete.locationBias = getSouthAfricaBoundsForPlaces(googleMaps)

// Listen for selections
placeAutocomplete.addEventListener('gmp-placeselect', async () => {
  const place = placeAutocomplete.getPlace?.()
  const location = await extractPlaceDetails(place)
  // Process...
})
```

### 2. South Africa Location Biasing
The component automatically applies biasing through:
- `componentRestrictions`: Restricts to South Africa (country: 'za')
- `locationBias`: Prioritizes results within South Africa bounds

```typescript
const placeAutocomplete = new PlaceAutocompleteElement()

// Set properties directly (modern pattern)
placeAutocomplete.componentRestrictions = { country: 'za' }
placeAutocomplete.locationBias = getSouthAfricaBoundsForPlaces(googleMaps)

// Result: South African addresses prioritized, international results deprioritized
```

### 3. Web Component Styling
Custom CSS can be applied through the Shadow DOM:

```css
/* Style the autocomplete dropdown */
gmp-place-autocomplete {
  --border-color: hsl(var(--border));
  --text-color: hsl(var(--foreground));
  --bg-color: hsl(var(--background));
}
```

## Error Handling

The component handles various error scenarios:

```typescript
// Missing API key
if (status === 'missing-key') {
  // Falls back to manual coordinate entry
}

// Network errors
if (!place?.geometry?.location) {
  setMessage('Choose one of the suggested addresses...')
}

// Invalid address search
if (!location) {
  setMessage('We could not find that address...')
}
```

## Mobile Considerations

The PlaceAutocompleteElement web component is fully responsive:

```tsx
// The component automatically adapts to mobile screens
<div className="grid gap-2 sm:grid-cols-[1fr_auto]">
  <div ref={containerRef} className="[&_input]:h-12 [&_input]:text-base" />
  <Button>Find address</Button>
</div>
```

## Performance Optimizations

1. **Lazy Initialization**: PlaceAutocompleteElement loads only when needed
2. **Memory Management**: Uses AbortController for cleanup
3. **Web Component**: Native browser optimization
4. **Ref Caching**: Prevents unnecessary re-initialization

## Manual Address Search Fallback

Users can still search manually if autocomplete fails:

```tsx
const searchTypedAddress = async () => {
  const trimmed = value.trim()
  const location = await geocodeAddress(trimmed)
  if (!location) {
    setMessage('Could not find that address...')
    return
  }
  onLocationSelect(location)
}
```

## Common Use Cases

### 1. Initial Location Setup
```tsx
useEffect(() => {
  if (!initialAddress) return
  setSearchAddress(initialAddress)
  // Component will auto-fill the input
}, [initialAddress])
```

### 2. Programmatic Location Selection
```tsx
const selectLocationProgrammatically = (address: string) => {
  setSearchAddress(address)
  // Trigger manual search
  await searchTypedAddress()
}
```

### 3. Location Validation
```tsx
const handleLocationSelect = (location) => {
  if (!location.placeId) {
    setMessage('Invalid location - please select from suggestions')
    return
  }
  // Proceed with valid location
}
```

## Debugging Tips

### Enable Verbose Logging
```typescript
// In LocationSearch.tsx, add console.logs:
console.log('PlaceAutocompleteElement initialized')
console.log('Place selected:', place)
console.log('Extracted location:', location)
```

### Check Browser Console
- Look for "PlaceAutocompleteElement is not available" errors
- Verify google.maps.importLibrary('places') is resolving
- Check network tab for Places API requests

### Verify South Africa Bounds
```typescript
const bounds = getSouthAfricaBoundsForPlaces(googleMaps)
console.log('SA Bounds:', bounds)
// Should output: { north: -22, south: -35, east: 33, west: 16 }
```

## Migration from Old API

If you have custom code using the old Autocomplete API:

```typescript
// OLD (deprecated)
const autocomplete = new google.maps.places.Autocomplete(inputElement, {
  bounds: getSouthAfricaBounds(googleMaps),
})
autocomplete.addListener('place_changed', handler)

// NEW (migrated)
const placeAutocomplete = new PlaceAutocompleteElement({
  requestOptions: {
    locationBias: getSouthAfricaBoundsForPlaces(googleMaps),
  },
})
placeAutocomplete.addEventListener('gmp-placeselect', handler)
```

## Environment Variables

Ensure your `.env` file is configured:

```env
# Required
VITE_GOOGLE_MAPS_API_KEY=your_api_key

# Optional (for custom map styling)
VITE_GOOGLE_MAPS_MAP_ID=your_map_id
```

## Related Components

- `LocationPicker`: Main component using `LocationSearch`
- `MapView`: Displays the map and marker
- `MapSkeletonLoader`: Fallback loading state
- `LocationPermissionModal`: Geolocation fallback UI

## Additional Resources

- [Google Places Web Component](https://developers.google.com/maps/documentation/js/place-autocomplete-element)
- [Places Library Reference](https://developers.google.com/maps/documentation/javascript/reference/places)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/start)

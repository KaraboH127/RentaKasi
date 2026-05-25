# Migration Testing Procedures

## Pre-Testing Checklist

- [ ] Ensure `.env` file has `VITE_GOOGLE_MAPS_API_KEY` configured
- [ ] Install all dependencies: `npm install`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit`
- [ ] No deprecated API usage found in codebase

## Unit Testing

### 1. Helper Functions

Test the new helper functions in `src/lib/google-maps.ts`:

```typescript
// Test getSouthAfricaBoundsForPlaces
import { getSouthAfricaBoundsForPlaces } from '@/lib/google-maps'

it('should return South Africa bounds in correct format', async () => {
  const google = await loadGoogleMapsApi()
  const bounds = getSouthAfricaBoundsForPlaces(google)
  
  expect(bounds.north).toBe(-22)
  expect(bounds.south).toBe(-35)
  expect(bounds.east).toBe(33)
  expect(bounds.west).toBe(16)
})

// Test extractPlaceDetails
import { extractPlaceDetails } from '@/lib/google-maps'

it('should extract place details correctly', async () => {
  const mockPlace = {
    formatted_address: '123 Main St, Johannesburg, South Africa',
    geometry: {
      location: {
        lat: () => -26.2041,
        lng: () => 28.0473,
      },
    },
    name: 'Main Street',
    place_id: 'ChIJU8c8n9RYUR4R57KnnTZFZ6c',
  }
  
  const location = await extractPlaceDetails(mockPlace)
  
  expect(location).toEqual({
    latitude: -26.2041,
    longitude: 28.0473,
    address: '123 Main St, Johannesburg, South Africa',
    placeId: 'ChIJU8c8n9RYUR4R57KnnTZFZ6c',
  })
})
```

## Integration Testing

### 2. LocationSearch Component

Test the component behavior:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationSearch } from '@/components/LocationSearch'

describe('LocationSearch Component', () => {
  it('should render the autocomplete input', async () => {
    const { container } = render(
      <LocationSearch
        value=""
        onValueChange={() => {}}
        onLocationSelect={() => {}}
      />
    )
    
    const input = container.querySelector('gmp-place-autocomplete input')
    expect(input).toBeInTheDocument()
  })

  it('should call onValueChange when user types', async () => {
    const handleValueChange = jest.fn()
    const { container } = render(
      <LocationSearch
        value=""
        onValueChange={handleValueChange}
        onLocationSelect={() => {}}
      />
    )
    
    const input = container.querySelector('gmp-place-autocomplete input')
    await userEvent.type(input!, 'Johannesburg')
    
    expect(handleValueChange).toHaveBeenCalledWith('Johannesburg')
  })

  it('should handle place selection', async () => {
    const handleLocationSelect = jest.fn()
    const { container } = render(
      <LocationSearch
        value=""
        onValueChange={() => {}}
        onLocationSelect={handleLocationSelect}
      />
    )
    
    // Simulate place selection
    const placeAutocomplete = container.querySelector('gmp-place-autocomplete')
    const event = new CustomEvent('gmp-placeselect')
    placeAutocomplete?.dispatchEvent(event)
    
    await waitFor(() => {
      expect(handleLocationSelect).toHaveBeenCalled()
    })
  })
})
```

## Manual Testing Procedures

### 3. Basic Functionality

**Scenario**: User searches for a location

```
1. Open the application
2. Navigate to location picker (e.g., create listing page)
3. Click on the search input
4. Type "Johannesburg"
5. Wait for suggestions to appear
6. Click on a suggestion
```

**Expected Result**:
- Suggestions appear after typing
- Address is populated
- Map updates automatically
- Marker appears on the correct location

### 4. South Africa Restrictions

**Scenario**: Verify South Africa biasing works

```
1. Search for "Main Street" (common street name)
2. Verify South African locations appear first
3. Search for a specific South African address (e.g., "Sandton Mall")
4. Verify the correct location is found
```

**Expected Result**:
- South African addresses prioritized
- International addresses appear but not first
- Component restricts to 'za' country

### 5. Automatic Map Pan/Zoom

**Scenario**: Map updates when location is selected

```
1. Select a location from autocomplete
2. Observe the map
3. Wait for animation to complete
```

**Expected Result**:
- Map pans to selected location
- Zoom level increases to 17
- Animation is smooth
- Marker is placed at correct position

### 6. Reverse Geocoding

**Scenario**: Test automatic address detection

```
1. Drop a pin on the map manually
2. Observe address field
```

**Expected Result**:
- Address is automatically populated via reverse geocoding
- Address matches the pin location
- No errors in console

### 7. Mobile Responsiveness

**Scenario**: Test on mobile devices or responsive view

```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Interact with location search
```

**Expected Result**:
- Input field is readable on small screens
- Autocomplete dropdown fits on screen
- Touch interactions work smoothly
- Buttons are tappable (minimum 44px)

### 8. Manual Address Search

**Scenario**: Fallback when autocomplete fails

```
1. Type an address that may not have suggestions
2. Click "Find address" button
3. OR press Enter key after typing
```

**Expected Result**:
- Geocoding fallback engages
- Address is resolved
- Location is selected correctly
- Map updates as expected

### 9. Error Handling

**Scenario**: Test error cases

```
A. No Google Maps API key
  1. Temporarily remove VITE_GOOGLE_MAPS_API_KEY
  2. Reload application
  3. Expected: Graceful error message, fallback UI works

B. Invalid address
  1. Type a nonsensical address (e.g., "xyzabc123")
  2. Click "Find address"
  3. Expected: Error message appears

C. Network errors
  1. Open DevTools Network tab
  2. Throttle to "Offline"
  3. Try to search
  4. Expected: Error message, not application crash
```

### 10. Disabled State

**Scenario**: Test disabled state

```
1. Temporarily set disabled={true} on LocationSearch
2. Attempt to interact with search
```

**Expected Result**:
- Input field is disabled (grayed out)
- No suggestions appear
- Buttons are disabled

### 11. Memory Leak Check

**Scenario**: Monitor for memory leaks

```
1. Open DevTools > Performance
2. Perform several searches and selections
3. Clear component state
4. Reload multiple times
5. Monitor heap size
```

**Expected Result**:
- Heap size returns to baseline after garbage collection
- No indefinitely growing memory usage
- Event listeners are properly cleaned up

### 12. Keyboard Navigation

**Scenario**: Test keyboard interactions

```
1. Focus on search input (Tab key)
2. Type to search
3. Press Down arrow to navigate suggestions
4. Press Enter to select
5. Press Escape to close suggestions
```

**Expected Result**:
- Keyboard navigation works as expected
- Selection works via Enter key
- Fallback search works with Enter when no suggestion is selected

## Performance Testing

### 13. Load Time

Test initial load performance:

```bash
# Using Lighthouse
npx lighthouse https://your-app-url --view
```

Check:
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS)

### 14. API Response Time

Monitor Places API response:

```
1. Open DevTools > Network tab
2. Search for locations
3. Note request times
4. Typical: 200-500ms for autocomplete suggestions
```

Expected: Suggestions appear within 500ms

## Browser Compatibility Testing

Test on:
- [ ] Chrome/Chromium 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Test Procedure:
```
1. Open application in each browser
2. Run through basic functionality test
3. Check console for errors
4. Verify map displays correctly
```

## Regression Testing

Ensure no existing functionality broke:

### Test Checklist:
- [ ] `LocationPicker` component works
- [ ] `MapView` displays correctly
- [ ] Geolocation detection works
- [ ] Manual coordinate entry works
- [ ] Form submission works
- [ ] All other location features work

## Automated Test Command

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- LocationSearch

# Run with coverage
npm test -- --coverage
```

## Debugging Commands

If issues occur, use these debugging commands:

```typescript
// Check PlaceAutocompleteElement availability
console.log(window.google.maps.importLibrary)

// Monitor place selections
const placeAutocomplete = document.querySelector('gmp-place-autocomplete')
placeAutocomplete.addEventListener('gmp-placeselect', (e) => {
  console.log('Place selected:', e)
  console.log('Place data:', placeAutocomplete.getPlace?.())
})

// Check South Africa bounds
import { getSouthAfricaBoundsForPlaces } from '@/lib/google-maps'
const bounds = getSouthAfricaBoundsForPlaces(window.google)
console.log('SA Bounds:', bounds)
```

## Troubleshooting

### Issue: "PlaceAutocompleteElement is not available"

**Solution**:
- Verify `libraries: 'places,marker'` in script URL
- Ensure `google.maps.importLibrary('places')` is called
- Check browser console for errors

### Issue: Suggestions don't appear

**Solution**:
- Check Google Places API is enabled in Console
- Verify API key has Places API access
- Check network requests in DevTools

### Issue: South Africa restrictions not working

**Solution**:
- Verify `getSouthAfricaBoundsForPlaces()` returns correct bounds
- Check `componentRestrictions: { country: 'za' }` is set
- Test with known SA address

### Issue: Memory leak detected

**Solution**:
- Verify event listeners are cleaned up with `AbortController`
- Check component unmounting properly
- Monitor heap in DevTools

## Sign-Off

Testing is complete when:
- [x] All functional tests pass
- [x] No memory leaks detected
- [x] Mobile responsiveness verified
- [x] Browser compatibility confirmed
- [x] No console errors
- [x] Performance acceptable
- [x] User experience preserved

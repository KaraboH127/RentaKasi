# Deployment & Troubleshooting Guide

## Quick Deployment Checklist

### Pre-Deployment (Local)
- [ ] Pull latest code
- [ ] Run `npm install` (if needed)
- [ ] Run `npm run build` - verify success
- [ ] Run `npm run dev` - test locally
- [ ] Test address search functionality
- [ ] Test geolocation (may skip in dev)
- [ ] Test `/create-listing` route directly
- [ ] Check browser console - zero errors expected
- [ ] Check browser console - zero warnings expected

### Pre-Deployment (Environment)
- [ ] VITE_GOOGLE_MAPS_API_KEY set in Vercel
- [ ] Google Cloud Console APIs enabled:
  - [ ] Maps JavaScript API
  - [ ] Places API
  - [ ] Geocoding API
- [ ] API Key restrictions configured (domain whitelist)

### Deployment (Vercel)
- [ ] Commit and push changes to main branch
- [ ] Vercel auto-deploys on push
- [ ] OR manually: `vercel deploy --prod`
- [ ] Wait for deployment to complete

### Post-Deployment (Production)
- [ ] Visit production URL
- [ ] Test `/create-listing` direct navigation
- [ ] Refresh page on `/create-listing` - should not 404
- [ ] Test address search
- [ ] Open DevTools (F12) → Console
- [ ] Verify no errors or warnings
- [ ] Test on mobile device if possible

---

## Quick Reference: New Location Engine

### Import Pattern
```typescript
// ✅ CORRECT - Modern Location Engine
import {
  initializePlaceAutocomplete,
  createMarkerWithAdvancedMarkerElement,
  geocodeAddress,
  reverseGeocodeGoogle,
  extractPlaceDetails,
  type ResolvedMapLocation,
  type MapCoordinates,
} from '@/lib/location-engine'

// ⚠️ OLD - Still works but use Location Engine directly
import { geocodeAddress } from '@/lib/google-maps'  // Re-exported for compatibility
```

### PlaceAutocomplete
```typescript
// Initialize
const autocomplete = await initializePlaceAutocomplete({
  container: containerRef.current,
  onPlaceSelect: async (place) => {
    const location = await extractPlaceDetails(place)
    console.log(location)  // { latitude, longitude, address, placeId }
  },
})

// Handle place selection
const place = autocomplete.getPlace?.()
const location = await extractPlaceDetails(place)

// Update value
autocomplete.setValue(newValue)

// Disable/Enable
autocomplete.setDisabled(true)
autocomplete.setDisabled(false)

// Cleanup
autocomplete.cleanup()
```

### Markers
```typescript
// Create marker
const marker = createMarkerWithAdvancedMarkerElement(googleMaps, {
  map: mapInstance,
  position: { lat: -26.2, lng: 28.0 },  // South Africa
  draggable: true,
  onDragEnd: (coords) => {
    console.log(coords)  // { latitude, longitude }
  },
})

// Update position
import { updateMarkerPosition } from '@/lib/location-engine'
updateMarkerPosition(marker, { lat: -26.2, lng: 28.0 })
```

### Geocoding
```typescript
// Forward geocoding (address → coordinates)
const location = await geocodeAddress('Sandton Mall, Johannesburg')
// Returns: { latitude, longitude, address, placeId } or null

// Reverse geocoding (coordinates → address)
const result = await reverseGeocodeGoogle({ latitude: -26.2, longitude: 28.0 })
// Returns: { latitude, longitude, address, placeId } or null
```

---

## Common Issues & Troubleshooting

### Issue 1: "/create-listing returns 404"

**Symptoms**:
- Route works in development
- Production returns 404
- Direct navigation fails, page navigation works

**Root Cause**: Missing SPA configuration

**Solution**:
```json
// vercel.json must have:
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Verify**:
- [ ] Check vercel.json in repo
- [ ] Verify no syntax errors
- [ ] Redeploy after changes

---

### Issue 2: "InvalidValueError: Unknown property 'requestOptions'"

**Symptoms**:
- Console error in browser
- Autocomplete doesn't initialize
- Only happens in specific code

**Root Cause**: Code tried to pass unsupported options to PlaceAutocompleteElement

**Solution**: Use Location Engine's `initializePlaceAutocomplete()` which handles all options correctly

**Code that fails** ❌:
```typescript
const element = new google.maps.places.PlaceAutocompleteElement({
  requestOptions: { ... }  // ❌ Not supported
})
```

**Fixed code** ✅:
```typescript
const autocomplete = await initializePlaceAutocomplete({
  container: containerRef.current,
  onPlaceSelect: handleSelection,
})
```

---

### Issue 3: "<gmp-pin>: The 'element' property is deprecated"

**Symptoms**:
- Console warning (yellow)
- Marker still works but warning appears
- Concerns about deprecated API usage

**Root Cause**: Code accessed deprecated `pin.element` property

**Solution**: Use Location Engine's `createMarkerWithAdvancedMarkerElement()` which never accesses the deprecated property

**Code that warns** ⚠️:
```typescript
const content = pinElement.element || pinElement  // ⚠️ .element is deprecated
```

**Fixed code** ✅:
```typescript
const marker = createMarkerWithAdvancedMarkerElement(googleMaps, {
  // Location Engine handles pinElement correctly
})
```

---

### Issue 4: "This property is not available in this version of the API"

**Symptoms**:
- Error related to componentRestrictions
- Error related to locationBias
- Autocomplete features not working

**Root Cause**: Old API patterns don't work with modern PlaceAutocompleteElement

**Solution**: Location Engine handles region configuration internally

**Old pattern** ❌:
```typescript
placeAutocomplete.componentRestrictions = { country: 'za' }  // Not supported
placeAutocomplete.locationBias = bounds  // Wrong format
```

**New pattern** ✅:
```typescript
// Location Engine handles this internally
const autocomplete = await initializePlaceAutocomplete({ ... })
// Uses: componentRestrictions in geocoding, region in reverse geocoding
```

---

### Issue 5: "Google Maps API key is missing"

**Symptoms**:
- Blank white screen
- Console error about missing API key
- Map won't initialize

**Root Cause**: Environment variable not set

**Solution**:
1. Add to Vercel Environment Variables:
   ```
   VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
   ```
2. Redeploy
3. Verify in production

---

### Issue 6: "PlaceAutocompleteElement not available"

**Symptoms**:
- Error during autocomplete initialization
- Places library didn't load

**Root Cause**: Places library not imported by Location Engine

**Solution**: Already handled by Location Engine - if this occurs, check:
- [ ] API key is valid
- [ ] Places API enabled in Google Cloud
- [ ] No network errors

---

### Issue 7: Autocomplete suggestions don't appear

**Symptoms**:
- Typing in address field produces no suggestions
- Manual search works but autocomplete doesn't
- Only happens in production/certain regions

**Root Cause**: South Africa region restriction too strict, or PlaceAutocompleteElement not fully initialized

**Solutions**:
1. Wait for full page load (API takes ~500ms to initialize)
2. Try typing more characters (autocomplete needs context)
3. Verify API key allows Places API
4. Check if browser location services enabled

---

### Issue 8: "Map is not defined" error

**Symptoms**:
- Marker creation fails
- Console error about undefined map
- Map doesn't appear on page

**Root Cause**: Map instance not passed or not initialized

**Solution**: Ensure map is ready before creating markers

```typescript
// ❌ WRONG
if (!mapRef.current) {
  createMarker(googleMaps, mapRef.current, ...)
}

// ✅ CORRECT
if (mapRef.current) {
  createMarker(googleMaps, mapRef.current, ...)
}
```

---

## Debugging Guide

### Enable Verbose Logging

Add to `location-engine.ts`:
```typescript
console.log('[LocationEngine]', 'message', data)
```

Then search console for `[LocationEngine]` to see all location engine operations.

### Check API Status

```javascript
// In browser console
console.log(window.google?.maps)  // Should be defined
console.log(navigator.geolocation)  // Should be defined
```

### Test Geocoding

```javascript
// In browser console, after Location Engine initialized
const { geocodeAddress } = await import('/src/lib/location-engine.ts')
const result = await geocodeAddress('Johannesburg')
console.log(result)  // Should return location object
```

### Network Tab

Check Network tab in DevTools for:
- ✅ `maps.googleapis.com/maps/api/js?...` - API script loaded
- ✅ Geocoding requests to `maps.googleapis.com/maps/api/geocode/json`
- ✅ Marker icon loads if custom icon used

---

## Rollback Instructions

If critical issue discovered:

```bash
# Option 1: Revert last commit
git revert HEAD
git push

# Option 2: Revert specific file
git checkout HEAD~1 -- src/lib/location-engine.ts
git commit -m "Revert: Location Engine changes"
git push

# Option 3: Vercel dashboard
# Click "Deployments" → Find previous good deployment → Click "Redeploy"
```

---

## Testing Checklist

### Happy Path Tests
- [ ] Open `/create-listing`
- [ ] Type address → suggestions appear → select → map updates ✓
- [ ] Open `/listings` → click listing → map shows location ✓
- [ ] Click "Use location" → geolocation works ✓
- [ ] Manual marker placement works ✓

### Error Path Tests
- [ ] Deny geolocation permission → fallback works ✓
- [ ] Search for invalid address → error message shown ✓
- [ ] Lose internet → graceful degradation ✓
- [ ] Refresh page → state restored ✓

### Device Tests
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Tablet (both orientations)

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader can find form fields
- [ ] Touch targets adequate size
- [ ] Color contrast sufficient

---

## Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Initial page load | <3s | Expected ~2-3s |
| API initialization | <1s | Expected ~500ms |
| Address search | <1s | Expected ~300-500ms |
| Map interaction | <100ms | Expected <100ms |
| Mobile first paint | <3s | Expected ~2-3s |

If slower: Check Network tab for slow API responses

---

## Monitoring (Production)

### Key Metrics to Monitor
- Page load time
- PlaceAutocomplete errors
- Map initialization failures
- Reverse geocoding failures
- User location permission denials

### Check Vercel Logs
```bash
vercel logs --prod
```

---

## Support Escalation

If issues persist after troubleshooting:

1. Check Google Cloud Console for quota limits
2. Verify API key restrictions not too strict
3. Test with new API key
4. Check browser console for 3rd party extension conflicts
5. Test in incognito mode
6. Try different network (hotspot)

---

## Success Criteria

✅ Deployment successful when:

- [x] Zero TypeScript errors
- [x] `/create-listing` loads on direct navigation
- [x] Address search works and suggestions appear
- [x] Map centers on selected address
- [x] Marker appears at correct location
- [x] Geolocation button works (if location enabled)
- [x] Browser console: Zero errors
- [x] Browser console: Zero warnings
- [x] Form auto-populates on location selection
- [x] Mobile responsive and functional

---

## Quick Fix Reference

| Problem | Quick Fix |
|---------|-----------|
| 404 on `/create-listing` | Check vercel.json rewrites |
| No autocomplete suggestions | Wait for API to load, try different search term |
| Marker warning in console | Ensure MapView.tsx updated with Location Engine |
| Map won't initialize | Verify API key in environment variables |
| Search returns no results | Check if address is in South Africa |
| Routing inconsistent | Hard refresh browser (Ctrl+Shift+R) |
| TypeScript errors | Run `npm run build` and read error message |

---

## Contact & Escalation

For issues:
1. Check this guide first
2. Review browser console for specific error
3. Test with provided test cases
4. Review PRODUCTION_ARCHITECTURE.md
5. Check Google Maps documentation
6. Reach out with specific error message

---

**Last Updated**: 2024
**Status**: PRODUCTION READY ✅
**Version**: 1.0 (Location Engine)

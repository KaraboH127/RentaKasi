# Quick Reference: Fixed API Patterns

## PlaceAutocompleteElement - Correct Usage

### ❌ WRONG (Causes InvalidValueError)
```typescript
const placeAutocomplete = new PlaceAutocompleteElement({
  requestOptions: {
    componentRestrictions: { country: 'za' },
    locationBias: bounds,
  },
})
```

### ✅ CORRECT (Modern Pattern)
```typescript
const placeAutocomplete = new PlaceAutocompleteElement()
placeAutocomplete.componentRestrictions = { country: 'za' }
placeAutocomplete.locationBias = bounds
```

---

## AdvancedMarkerElement with PinElement - Correct Usage

### ❌ WRONG (Deprecation Warning)
```typescript
const pin = new googleMaps.maps.marker.PinElement({
  background: '#e85d2a',
})
const marker = new googleMaps.maps.marker.AdvancedMarkerElement({
  content: pin?.element,  // ⚠️ DEPRECATED
  map,
  position,
})
```

### ✅ CORRECT (Modern Fallback)
```typescript
const pinElement = new googleMaps.maps.marker.PinElement({
  background: '#e85d2a',
})
const marker = new googleMaps.maps.marker.AdvancedMarkerElement({
  content: pinElement.element || pinElement,  // Safe fallback
  map,
  position,
})
```

---

## Property Reference

### PlaceAutocompleteElement
Set these properties directly on the element instance:

| Property | Type | Description |
|----------|------|-------------|
| `componentRestrictions` | `object` | Restrict by country: `{ country: 'za' }` |
| `locationBias` | `object` | Bias results to area: `{ north, south, east, west }` |
| `locationRestriction` | `object` | Hard restrict to area: `{ north, south, east, west }` |

### AdvancedMarkerElement
Valid initialization options:

| Property | Type | Description |
|----------|------|-------------|
| `map` | `Map` | The map instance |
| `position` | `LatLng` | Marker position |
| `content` | `Element\|string` | Custom marker content |
| `gmpDraggable` | `boolean` | Allow dragging |
| `title` | `string` | Marker title |

---

## Event Handlers

### PlaceAutocompleteElement Selection
```typescript
placeAutocomplete.addEventListener('gmp-placeselect', () => {
  const place = placeAutocomplete.getPlace?.()
  // Process place data
})
```

### AdvancedMarkerElement Drag End
```typescript
marker.addListener('dragend', () => {
  const position = marker.position
  // Handle new position
})
```

---

## Troubleshooting

### Issue: "InvalidValueError: Unknown property 'requestOptions'"
**Solution**: Set properties directly on element, not in constructor
```typescript
// Instead of:
new PlaceAutocompleteElement({ requestOptions: {...} })

// Do:
const elem = new PlaceAutocompleteElement()
elem.componentRestrictions = {...}
```

### Issue: "<gmp-pin>: The 'element' property is deprecated"
**Solution**: Use conditional fallback
```typescript
// Instead of:
content: pin?.element

// Do:
content: pin?.element || pin
```

---

## Testing Commands

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check browser console for errors/warnings
# (Open DevTools → Console tab)

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## Verification Checklist

- [ ] No `InvalidValueError` in console
- [ ] No `<gmp-pin>: The 'element' property is deprecated` warning
- [ ] Autocomplete suggestions appear
- [ ] Marker displays correctly
- [ ] Marker dragging works
- [ ] South Africa biasing works
- [ ] TypeScript compiles (0 errors)

---

## Additional Resources

- [PlaceAutocompleteElement API](https://developers.google.com/maps/documentation/js/place-autocomplete-element)
- [AdvancedMarkerElement API](https://developers.google.com/maps/documentation/js/advanced-markers)
- [Bug Fixes Documentation](BUG_FIXES.md)
- [Implementation Examples](IMPLEMENTATION_EXAMPLES.md)

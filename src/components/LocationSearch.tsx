import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { fromGoogleLatLng, geocodeAddress, getSouthAfricaBounds, type ResolvedMapLocation } from '@/lib/google-maps'

interface LocationSearchProps {
  disabled?: boolean
  onLocationSelect: (location: ResolvedMapLocation) => void
  onValueChange: (value: string) => void
  placeholder?: string
  value: string
}

export const LocationSearch = forwardRef<HTMLInputElement, LocationSearchProps>(function LocationSearch({ disabled = false, onLocationSelect, onValueChange, placeholder = 'Search address, landmark, or township', value }, forwardedRef) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any | null>(null)
  const listenerRef = useRef<{ remove: () => void } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { googleMaps, isReady, status } = useGoogleMaps()

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)

  useEffect(() => {
    if (!isReady || !googleMaps || !inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new googleMaps.maps.places.Autocomplete(inputRef.current, {
      bounds: getSouthAfricaBounds(googleMaps),
      componentRestrictions: { country: 'za' },
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      strictBounds: false,
    })

    listenerRef.current = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place?.geometry?.location) {
        setMessage('Choose one of the suggested addresses so we can place the pin.')
        return
      }

      const address = place.formatted_address || place.name || value
      onValueChange(address)
      setMessage('Location selected successfully.')
      onLocationSelect({
        ...fromGoogleLatLng(place.geometry.location),
        address,
        placeId: place.place_id ?? null,
      })
    })

    return () => {
      listenerRef.current?.remove()
      listenerRef.current = null
      autocompleteRef.current = null
    }
  }, [googleMaps, isReady, onLocationSelect, onValueChange, value])

  const searchTypedAddress = async () => {
    const trimmed = value.trim()
    if (!trimmed) return

    setIsSearching(true)
    setMessage(null)

    try {
      const location = await geocodeAddress(trimmed)
      if (!location) {
        setMessage('We could not find that address. Try adding the township, city, or a nearby landmark.')
        return
      }

      setMessage('Location selected successfully.')
      onValueChange(location.address ?? trimmed)
      onLocationSelect(location)
    } catch {
      setMessage('Address search is unavailable right now. You can still drop the pin manually.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void searchTypedAddress()
  }
  const canSearchWithGoogle = status !== 'missing-key' && status !== 'error'

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => {
              setMessage(null)
              onValueChange(event.target.value)
            }}
            onKeyDown={handleKeyDown}
            className="h-12 w-full rounded-xl border bg-background pl-10 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="street-address"
          />
        </label>
        <Button type="button" variant="outline" className="h-12 gap-2" onClick={searchTypedAddress} disabled={disabled || isSearching || !value.trim() || !canSearchWithGoogle}>
          <MapPin className="h-4 w-4" />
          {isSearching ? 'Searching...' : 'Find address'}
        </Button>
      </div>

      {status === 'missing-key' && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Google Places will activate after `VITE_GOOGLE_MAPS_API_KEY` is configured. Manual coordinates and pin drop remain available.
        </p>
      )}
      {message && <p className="text-xs font-medium text-muted-foreground" role="status">{message}</p>}
    </div>
  )
})

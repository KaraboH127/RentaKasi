import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import {
  extractPlaceDetails,
  geocodeAddress,
  initializePlaceAutocomplete,
  type ResolvedMapLocation,
} from '@/lib/location-engine'

interface LocationSearchProps {
  disabled?: boolean
  onLocationSelect: (location: ResolvedMapLocation) => void
  onValueChange: (value: string) => void
  placeholder?: string
  value: string
}

export const LocationSearch = forwardRef<HTMLInputElement, LocationSearchProps>(function LocationSearch(
  { disabled = false, onLocationSelect, onValueChange, placeholder = 'Search address, landmark, or township', value },
  forwardedRef
) {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<any | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { googleMaps, isReady } = useGoogleMaps()

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)

  // Initialize PlaceAutocompleteElement using Location Engine
  useEffect(() => {
    if (!isReady || !googleMaps || !containerRef.current || autocompleteRef.current) return

    const initializeAutocomplete = async () => {
      try {
        const autocomplete = await initializePlaceAutocomplete({
          container: containerRef.current!,
          onPlaceSelect: async () => {
            const place = autocomplete.getPlace?.()

            if (!place?.geometry?.location) {
              setMessage('Choose one of the suggested addresses so we can place the pin.')
              return
            }

            try {
              const location = await extractPlaceDetails(place)
              if (!location) {
                setMessage('Could not extract location details. Please try again.')
                return
              }

              const address = place.formatted_address || place.name || value
              onValueChange(address)
              setMessage('Location selected successfully.')
              onLocationSelect(location)
            } catch (error) {
              console.error('Error processing place selection:', error)
              setMessage('Error processing the selected address. Please try again.')
            }
          },
        })

        autocompleteRef.current = autocomplete

        // Apply custom styling to match the input field
        if (autocomplete.input) {
          autocomplete.input.className =
            'h-12 w-full rounded-xl border bg-background pl-10 pr-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'
          autocomplete.input.placeholder = placeholder
          autocomplete.input.disabled = disabled
          autocomplete.input.value = value
          autocomplete.input.autocomplete = 'street-address'

          // Sync input value changes
          autocomplete.input.addEventListener('input', (e: Event) => {
            const inputElement = e.target as HTMLInputElement
            setMessage(null)
            onValueChange(inputElement.value)
          })
        }
      } catch (error) {
        console.error('Failed to initialize PlaceAutocompleteElement:', error)
      }
    }

    void initializeAutocomplete()

    return () => {
      if (autocompleteRef.current?.cleanup) {
        autocompleteRef.current.cleanup()
      }
      autocompleteRef.current = null
    }
  }, [googleMaps, isReady, onLocationSelect, onValueChange, placeholder, disabled, value])

  // Update PlaceAutocompleteElement value when prop changes
  useEffect(() => {
    if (!autocompleteRef.current) return
    autocompleteRef.current.setValue(value)
  }, [value])

  // Update disabled state
  useEffect(() => {
    if (!autocompleteRef.current) return
    autocompleteRef.current.setDisabled(disabled)
  }, [disabled])

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return

    const place = autocompleteRef.current?.getPlace?.()
    if (!place) {
      event.preventDefault()
      void searchTypedAddress()
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            className="[&>gmp-place-autocomplete]:w-full [&_input]:pl-10 [&_input]:h-12 [&_input]:text-base"
          />
          <input ref={inputRef} type="hidden" value={value} onChange={() => {}} />
        </label>
        <Button
          type="button"
          variant="outline"
          className="h-12 gap-2"
          onClick={searchTypedAddress}
          disabled={disabled || isSearching || !value.trim()}
        >
          <MapPin className="h-4 w-4" />
          {isSearching ? 'Searching...' : 'Find address'}
        </Button>
      </div>

      {message && (
        <p className="text-xs font-medium text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  )
})


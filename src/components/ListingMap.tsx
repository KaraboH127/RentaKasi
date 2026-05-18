import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/lib/listings'
import { cn } from '@/lib/utils'

interface ListingMapProps {
  listings: Listing[]
  className?: string
  compact?: boolean
}

function getMapPosition(listing: Listing, listings: Listing[]) {
  const mapped = listings.filter((item) => item.latitude !== null && item.longitude !== null)
  const latitudes = mapped.map((item) => item.latitude as number)
  const longitudes = mapped.map((item) => item.longitude as number)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const latRange = Math.max(maxLat - minLat, 0.01)
  const lngRange = Math.max(maxLng - minLng, 0.01)

  return {
    left: `${8 + (((listing.longitude as number) - minLng) / lngRange) * 84}%`,
    top: `${92 - (((listing.latitude as number) - minLat) / latRange) * 84}%`,
  }
}

export function ListingMap({ listings, className, compact = false }: ListingMapProps) {
  const mappedListings = useMemo(() => listings.filter((item) => item.latitude !== null && item.longitude !== null), [listings])
  const [activeId, setActiveId] = useState(mappedListings[0]?.id)
  const activeListing = mappedListings.find((item) => item.id === activeId) ?? mappedListings[0]

  if (mappedListings.length === 0) {
    return (
      <div className={cn('rounded-2xl border bg-muted/50 p-5 text-center', className)}>
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-card text-muted-foreground">
          <MapPin className="h-5 w-5" />
        </div>
        <p className="font-display font-semibold">Map coming soon for these rooms</p>
        <p className="mt-1 text-sm text-muted-foreground">Listings without coordinates still show township and landmark details.</p>
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm', className)}>
      <div className={cn('relative bg-[radial-gradient(circle_at_20%_20%,hsl(var(--secondary)/.18),transparent_24%),radial-gradient(circle_at_80%_30%,hsl(var(--primary)/.14),transparent_22%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]', compact ? 'h-56' : 'h-[360px]')}>
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          {mappedListings.length} pinned {mappedListings.length === 1 ? 'room' : 'rooms'}
        </div>

        {mappedListings.map((listing) => {
          const position = getMapPosition(listing, mappedListings)
          const isActive = listing.id === activeListing?.id
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => setActiveId(listing.id)}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-full rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'z-20 text-primary' : 'z-10 text-secondary',
              )}
              style={position}
              aria-label={`Open ${listing.title}`}
            >
              <MapPin className={cn('h-9 w-9 drop-shadow-md', isActive && 'fill-primary')} />
            </button>
          )
        })}

        {activeListing && (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur sm:left-auto sm:w-80">
            <div className="flex gap-3">
              <img src={activeListing.images[0] || activeListing.outsidePhotoUrl || 'https://placehold.co/120x90/e3ddd8/1f242d?text=Room'} alt={activeListing.title} className="h-16 w-20 rounded-xl object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-sm">{activeListing.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{activeListing.landmark || activeListing.location}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-primary">R{activeListing.price}<span className="font-sans text-[10px] font-normal text-muted-foreground">/mo</span></span>
                  <Link to={`/listing/${activeListing.id}`}>
                    <Button size="sm" className="h-8 gap-1.5 px-3">
                      <Navigation className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

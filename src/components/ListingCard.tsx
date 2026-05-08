import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { Listing } from '@/lib/listings'

interface ListingCardProps {
  listing: Listing
  featured?: boolean
}

export function ListingCard({ listing, featured = false }: ListingCardProps) {
  const primaryImage = listing.images?.[0] || 'https://placehold.co/600x400/e3ddd8/1f242d?text=No+Image'

  return (
    <Link to={`/listing/${listing.id}`} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl touch-manipulation">
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card h-full flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={primaryImage}
            alt={listing.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {featured && <Badge className="bg-primary text-primary-foreground shadow-sm text-[10px] px-1.5 py-0.5">Featured</Badge>}
            <Badge variant="secondary" className="shadow-sm flex items-center gap-0.5 backdrop-blur-md bg-background/80 text-foreground border-none text-[10px] px-1.5 py-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {listing.location}
            </Badge>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-display font-semibold text-sm sm:text-base lg:text-lg line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
              {listing.title}
            </h3>
            <div className="shrink-0 text-right">
              <p className="font-display font-bold text-sm sm:text-base lg:text-lg text-primary leading-none">R{listing.price}</p>
              <span className="text-[10px] text-muted-foreground">/mo</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 hidden sm:block flex-grow">
            {listing.description}
          </p>

          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">By {listing.landlordName}</span>
            <span className="shrink-0 ml-2 text-primary font-medium">View -&gt;</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrustBadges } from '@/components/TrustBadges'
import { getRoomTypeLabel } from '@/lib/rental-options'
import { MapPin, ShieldCheck } from 'lucide-react'
import type { Listing } from '@/lib/listings'

interface ListingCardProps {
  listing: Listing
  featured?: boolean
}

export function ListingCard({ listing, featured = false }: ListingCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const primaryImage = listing.images?.[0] || listing.outsidePhotoUrl || 'https://placehold.co/600x400/e3ddd8/1f242d?text=No+Image'
  const isTrusted = listing.landlordVerified || listing.verificationStatus === 'verified'

  return (
    <Link to={`/listing/${listing.id}`} className="group block rounded-2xl touch-manipulation rk-focus">
      <article className="rk-surface rk-card-hover rk-interactive h-full overflow-hidden rounded-2xl flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
          <img
            src={primaryImage}
            alt={listing.title}
            className="object-cover w-full h-full transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.045]"
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {featured && <Badge className="bg-primary text-primary-foreground shadow-sm text-[10px] px-1.5 py-0.5">Featured</Badge>}
            {isTrusted && (
              <Badge className="gap-1 bg-secondary text-secondary-foreground shadow-sm text-[10px] px-1.5 py-0.5">
                <ShieldCheck className="h-3 w-3" />
                Trusted
              </Badge>
            )}
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <Badge variant="secondary" className="shadow-sm flex min-w-0 items-center gap-0.5 backdrop-blur-md bg-background/90 text-foreground border-none text-[10px] px-1.5 py-0.5">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate">{listing.landmark || listing.location}</span>
            </Badge>
            <div className="rounded-full bg-card/95 px-2 py-1 text-right shadow-sm backdrop-blur">
              <p className="font-display text-sm font-bold leading-none text-primary sm:text-base">R{listing.price}</p>
              <span className="text-[10px] text-muted-foreground">/mo</span>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <div className="mb-2">
            <h3 className="font-display font-semibold text-sm sm:text-base lg:text-lg line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="truncate">{listing.location}</span>
            </p>
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] font-medium">{getRoomTypeLabel(listing.roomType)}</Badge>
            <TrustBadges listing={listing} />
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 hidden sm:block flex-grow">
            {listing.description}
          </p>

          <div className="mt-3 pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">By {listing.landlordName}</span>
            <span className="shrink-0 ml-2 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">View</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Listing } from '@/lib/listings'

export function TrustBadges({ listing }: { listing: Listing }) {
  return (
    <div className="flex flex-wrap gap-2">
      {listing.landlordVerified && (
        <Badge className="gap-1 bg-secondary text-secondary-foreground">
          <BadgeCheck className="h-3 w-3" />
          Verified landlord
        </Badge>
      )}
      {listing.verificationStatus === 'verified' && (
        <Badge className="gap-1 bg-primary text-primary-foreground">
          <ShieldCheck className="h-3 w-3" />
          Verified property
        </Badge>
      )}
      {listing.verificationStatus === 'pending' && (
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Verification pending
        </Badge>
      )}
    </div>
  )
}

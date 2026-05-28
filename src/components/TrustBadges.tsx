import { BadgeCheck, Ban, Clock, Phone, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Listing } from '@/lib/listings'

export function TrustBadges({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const labelClassName = compact ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'gap-1'

  return (
    <div className="flex flex-wrap gap-2">
      {listing.landlordTrustStatus === 'trusted' && (
        <Badge className={`${labelClassName} border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/15`}>
          <BadgeCheck className="h-3 w-3" />
          Trusted
        </Badge>
      )}
      {listing.landlordTrustStatus === 'phone_verified' && (
        <Badge variant="outline" className={`${labelClassName} border-primary/25 bg-primary/5 text-primary`}>
          <Phone className="h-3 w-3" />
          Phone verified
        </Badge>
      )}
      {listing.landlordTrustStatus === 'pending' && (
        <Badge variant="outline" className={`${labelClassName} text-muted-foreground`}>
          <Clock className="h-3 w-3" />
          New
        </Badge>
      )}
      {listing.landlordTrustStatus === 'suspended' && (
        <Badge variant="outline" className={`${labelClassName} border-destructive/40 text-destructive`}>
          <ShieldAlert className="h-3 w-3" />
          Suspended
        </Badge>
      )}
      {listing.landlordTrustStatus === 'banned' && (
        <Badge variant="outline" className={`${labelClassName} border-destructive/40 text-destructive`}>
          <Ban className="h-3 w-3" />
          Banned
        </Badge>
      )}
      {listing.verificationStatus === 'verified' && (
        <Badge className={`${labelClassName} bg-primary text-primary-foreground`}>
          <ShieldCheck className="h-3 w-3" />
          Verified property
        </Badge>
      )}
      {listing.verificationStatus === 'pending' && (
        <Badge variant="outline" className={labelClassName}>
          <ShieldCheck className="h-3 w-3" />
          Verification pending
        </Badge>
      )}
    </div>
  )
}

import { BadgeCheck, Ban, Clock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Listing } from '@/lib/listings'

export function TrustBadges({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const labelClassName = compact ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'gap-1'

  return (
    <div className="flex flex-wrap gap-2">
      {listing.landlordTrustStatus === 'verified' && (
        <Badge className={`${labelClassName} bg-secondary text-secondary-foreground`}>
          <BadgeCheck className="h-3 w-3" />
          Verified landlord
        </Badge>
      )}
      {listing.landlordTrustStatus === 'trust_pending' && (
        <Badge variant="outline" className={labelClassName}>
          <Clock className="h-3 w-3" />
          Trust pending
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

import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LandlordVerificationBadge } from '@/components/LandlordVerification'
import type { Listing } from '@/lib/listings'

export function TrustBadges({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const labelClassName = compact ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'gap-1'

  return (
    <div className="flex flex-wrap gap-2">
      <LandlordVerificationBadge status={listing.landlordTrustStatus} compact={compact} publicLabel className={labelClassName} />
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

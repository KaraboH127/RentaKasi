import { Phone, ShieldCheck, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LandlordVerificationBadge } from '@/components/LandlordVerification'
import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/listings'

export function LandlordProfileCard({ listing }: { listing: Listing }) {
  const { landlordName, landlordPhone, landlordTrustStatus, landlordHiddenAt } = listing

  // Extract initials for avatar
  const initials = landlordName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isRestricted = landlordHiddenAt || landlordTrustStatus === 'suspended' || landlordTrustStatus === 'banned'

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-4 sm:p-5',
        isRestricted ? 'border-destructive/25 bg-destructive/5' : 'border-border'
      )}
    >
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{landlordName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <LandlordVerificationBadge status={landlordTrustStatus} compact publicLabel />
            {landlordHiddenAt && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 border-destructive/35 bg-destructive/5 text-destructive">
                <MapPin className="w-2.5 h-2.5 mr-0.5" />
                Hidden
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Phone Contact */}
      {landlordPhone && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-widest mb-2">Contact</p>
          <a href={`tel:${landlordPhone}`} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Phone className="w-4 h-4" />
            {landlordPhone}
          </a>
        </div>
      )}

      {/* Trust Information */}
      <div className="mb-4">
        <div
          className={cn(
            'rounded-xl p-3 flex gap-2',
            (landlordTrustStatus === 'trusted' || landlordTrustStatus === 'verified')
              ? 'bg-secondary/5 border border-secondary/25'
              : landlordTrustStatus === 'phone_verified'
                ? 'bg-primary/5 border border-primary/25'
                : 'bg-muted/50'
          )}
        >
          <ShieldCheck
            className={cn(
              'h-4 w-4 shrink-0 mt-0.5',
              (landlordTrustStatus === 'trusted' || landlordTrustStatus === 'verified')
                ? 'text-secondary'
                : landlordTrustStatus === 'phone_verified'
                  ? 'text-primary'
                  : 'text-muted-foreground'
            )}
          />
          <div className="text-xs leading-relaxed text-muted-foreground">
            {(landlordTrustStatus === 'trusted' || landlordTrustStatus === 'verified') && (
              <span>
                <strong className="text-foreground">Verified landlord.</strong> This landlord has passed RentaKasi trust checks and has a strong track record.
              </span>
            )}
            {landlordTrustStatus === 'phone_verified' && (
              <span>
                <strong className="text-foreground">Phone verified.</strong> This landlord has confirmed their contact information.
              </span>
            )}
            {landlordTrustStatus === 'pending' && (
              <span>
                <strong className="text-foreground">Pending verification.</strong> Always meet in person and verify property details before paying.
              </span>
            )}
            {(landlordTrustStatus === 'suspended' || landlordTrustStatus === 'banned') && (
              <span>
                <strong className="text-destructive">Account restricted.</strong> This account is currently not available on the platform.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Safety Reminder (Always shown for pending, subtle for others) */}
      {landlordTrustStatus === 'pending' && (
        <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Safety reminder</p>
          <p>Always meet in person, verify the property matches photos, and never send money before you're certain the room and landlord details are real.</p>
        </div>
      )}
    </div>
  )
}

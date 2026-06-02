import { BadgeCheck, Ban, Clock, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LandlordVerificationStatus } from '@/lib/listings'

type VerificationTone = 'neutral' | 'safe' | 'trusted' | 'restricted'

interface StatusContent {
  label: string
  publicLabel: string
  title: string
  description: string
  detail: string
  tenantPerspective: string
  nextSteps: string
  icon: typeof Clock
  tone: VerificationTone
}

export const verificationStatusDetails: Record<LandlordVerificationStatus, StatusContent> = {
  pending: {
    label: 'Pending',
    publicLabel: 'Pending Verification',
    title: 'Verification is still in progress',
    description: 'Your account is under initial review.',
    detail: 'You can list rooms, but tenants will see that verification is still in progress. They may take extra time to verify details independently.',
    tenantPerspective: 'Tenants see: This landlord is new and unverified. They should still complete normal safety checks before paying or sharing documents.',
    nextSteps: 'Complete phone verification to move forward. Confirm a reachable South African mobile number linked to your account.',
    icon: Clock,
    tone: 'neutral',
  },
  verified: {
    label: 'Verified',
    publicLabel: 'Verified Landlord',
    title: 'Landlord verification is complete',
    description: 'You have passed platform verification checks.',
    detail: 'You have completed RentaKasi landlord verification checks. Your listings get better visibility and clearer tenant confidence.',
    tenantPerspective: 'Tenants see: This landlord has completed RentaKasi verification checks. This is a strong positive signal.',
    nextSteps: 'Maintain your verified status by continuing to respond to tenants and keeping your account in good standing. Avoid reports and violations.',
    icon: BadgeCheck,
    tone: 'trusted',
  },
  suspended: {
    label: 'Suspended',
    publicLabel: 'Suspended',
    title: 'Account currently restricted',
    description: 'Your account is under moderation review.',
    detail: 'Your account has been restricted while safety or moderation concerns are reviewed. Your listings are hidden until this is resolved.',
    tenantPerspective: 'Tenants see: This account is currently not available on the platform. Their listings are hidden.',
    nextSteps: 'Contact RentaKasi support for more information about why your account was suspended and what you can do to appeal.',
    icon: ShieldAlert,
    tone: 'restricted',
  },
  banned: {
    label: 'Banned',
    publicLabel: 'Banned',
    title: 'Account permanently removed',
    description: 'Account is no longer allowed on the platform.',
    detail: 'Your account has been permanently banned from RentaKasi marketplace activity. You are no longer able to list properties or interact with tenants.',
    tenantPerspective: 'Tenants see: This account has been permanently removed from the platform.',
    nextSteps: 'If you believe this was in error, please contact RentaKasi support for an appeal process.',
    icon: Ban,
    tone: 'restricted',
  },
}

const badgeClasses: Record<VerificationTone, string> = {
  neutral: 'border-muted-foreground/25 bg-muted/45 text-muted-foreground',
  safe: 'border-primary/25 bg-primary/5 text-primary',
  trusted: 'border-secondary/30 bg-secondary/10 text-secondary',
  restricted: 'border-destructive/35 bg-destructive/5 text-destructive',
}

export function VerificationStatusDetail({
  status,
  className,
}: {
  status: LandlordVerificationStatus
  className?: string
}) {
  const content = verificationStatusDetails[status]
  const Icon = content.icon

  return (
    <article className={cn('rounded-2xl border bg-card p-4 sm:p-6', className)}>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border', badgeClasses[content.tone])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{content.label}</p>
          <h3 className="font-display text-lg font-bold">{content.title}</h3>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">For you</p>
          <p className="text-sm leading-relaxed text-foreground">{content.detail}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">What tenants see</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.tenantPerspective}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Next steps</p>
          <p className="text-sm leading-relaxed text-foreground font-medium">{content.nextSteps}</p>
        </div>
      </div>
    </article>
  )
}

export function VerificationStatusCompactDetail({ status, className }: { status: LandlordVerificationStatus; className?: string }) {
  const content = verificationStatusDetails[status]

  return (
    <div className={cn('rounded-xl border bg-muted/25 p-3 sm:p-4', className)}>
      <p className="font-display font-semibold text-sm mb-1">{content.title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{content.detail}</p>
    </div>
  )
}

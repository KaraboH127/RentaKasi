import { Link } from 'react-router-dom'
import { BadgeCheck, Ban, Check, Clock, Eye, Phone, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LandlordTrustStatus } from '@/lib/listings'

type VerificationTone = 'neutral' | 'safe' | 'trusted' | 'restricted'

interface StatusContent {
  label: string
  publicLabel: string
  description: string
  detail: string
  icon: typeof Clock
  tone: VerificationTone
}

export const landlordVerificationStatuses: Record<LandlordTrustStatus, StatusContent> = {
  pending: {
    label: 'Pending',
    publicLabel: 'Pending Verification',
    description: 'Verification is still in progress.',
    detail: 'The landlord can list rooms, but tenants should still complete normal safety checks before paying or sharing documents.',
    icon: Clock,
    tone: 'neutral',
  },
  phone_verified: {
    label: 'Phone Verified',
    publicLabel: 'Phone Verified',
    description: 'Phone number has been verified.',
    detail: 'The landlord has confirmed a reachable South African mobile number linked to their account.',
    icon: Phone,
    tone: 'safe',
  },
  trusted: {
    label: 'Trusted',
    publicLabel: 'Trusted Landlord',
    description: 'Landlord has met trust requirements.',
    detail: 'The landlord has passed platform trust checks and has a stronger trust record on RentaKasi.',
    icon: BadgeCheck,
    tone: 'trusted',
  },
  suspended: {
    label: 'Suspended',
    publicLabel: 'Suspended',
    description: 'Account currently restricted.',
    detail: 'The account is restricted while safety or moderation concerns are reviewed.',
    icon: ShieldAlert,
    tone: 'restricted',
  },
  banned: {
    label: 'Banned',
    publicLabel: 'Banned',
    description: 'Account permanently removed from platform activity.',
    detail: 'The account is no longer allowed to participate in RentaKasi marketplace activity.',
    icon: Ban,
    tone: 'restricted',
  },
}

const statusOrder: LandlordTrustStatus[] = ['pending', 'phone_verified', 'trusted', 'suspended', 'banned']
const activeProgressSteps: LandlordTrustStatus[] = ['pending', 'phone_verified', 'trusted']

const badgeClasses: Record<VerificationTone, string> = {
  neutral: 'border-muted-foreground/25 bg-muted/45 text-muted-foreground',
  safe: 'border-primary/25 bg-primary/5 text-primary',
  trusted: 'border-secondary/30 bg-secondary/10 text-secondary',
  restricted: 'border-destructive/35 bg-destructive/5 text-destructive',
}

function getStepState(status: LandlordTrustStatus, step: LandlordTrustStatus) {
  if (status === 'suspended' || status === 'banned') return step === 'pending' ? 'blocked' : 'upcoming'
  const currentIndex = activeProgressSteps.indexOf(status)
  const stepIndex = activeProgressSteps.indexOf(step)
  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}

export function LandlordVerificationBadge({
  status,
  compact = false,
  publicLabel = false,
  className,
}: {
  status: LandlordTrustStatus
  compact?: boolean
  publicLabel?: boolean
  className?: string
}) {
  const content = landlordVerificationStatuses[status]
  const Icon = content.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border font-medium',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        badgeClasses[content.tone],
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {publicLabel ? content.publicLabel : content.label}
    </Badge>
  )
}

export function VerificationProgress({ status }: { status: LandlordTrustStatus }) {
  const steps = [
    { key: 'pending' as const, title: 'Phone Verification', caption: 'Confirm a reachable phone number' },
    { key: 'phone_verified' as const, title: 'Trust Review', caption: 'Review account and listing signals' },
    { key: 'trusted' as const, title: 'Trusted Landlord', caption: 'Earn stronger tenant confidence' },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const state = getStepState(status, step.key)
        const isComplete = state === 'complete'
        const isCurrent = state === 'current'
        const isBlocked = state === 'blocked'

        return (
          <div
            key={step.key}
            className={cn(
              'rounded-xl border bg-background p-3',
              isCurrent && 'border-primary/35 bg-primary/5',
              isComplete && 'border-secondary/25 bg-secondary/5',
              isBlocked && 'border-destructive/25 bg-destructive/5',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">Step {index + 1}</span>
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold',
                  isComplete && 'border-secondary bg-secondary text-secondary-foreground',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isBlocked && 'border-destructive bg-destructive text-destructive-foreground',
                  state === 'upcoming' && 'border-border bg-muted text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
            </div>
            <p className="font-display text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.caption}</p>
          </div>
        )
      })}
    </div>
  )
}

export function VerificationBenefits() {
  const benefits = [
    'Rank higher when tenants compare similar listings',
    'Give tenants clearer confidence before they contact you',
    'Gain increased visibility in trust-aware surfaces',
    'Improve listing performance through stronger safety signals',
  ]

  return (
    <div className="grid gap-2">
      {benefits.map((benefit) => (
        <div key={benefit} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{benefit}</span>
        </div>
      ))}
    </div>
  )
}

export function LandlordVerificationCard({
  status,
  trustScore,
  riskScore,
  reportCount,
}: {
  status: LandlordTrustStatus
  trustScore?: number | null
  riskScore?: number | null
  reportCount?: number | null
}) {
  const content = landlordVerificationStatuses[status]

  return (
    <section className="rk-surface rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Landlord Verification</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold">Current Status</h2>
            <LandlordVerificationBadge status={status} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{content.detail}</p>
        </div>
        <Link to="/verification">
          <Button variant="outline" className="w-full gap-2 sm:w-auto">
            <ShieldCheck className="h-4 w-4" />
            View details
          </Button>
        </Link>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/45 p-3">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Trust score</p>
          <p className="mt-1 font-display text-2xl font-bold">{trustScore ?? 40}</p>
        </div>
        <div className="rounded-xl bg-muted/45 p-3">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Risk score</p>
          <p className="mt-1 font-display text-2xl font-bold">{riskScore ?? 0}</p>
        </div>
        <div className="rounded-xl bg-muted/45 p-3">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Open signals</p>
          <p className="mt-1 font-display text-2xl font-bold">{reportCount ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <h3 className="mb-3 font-display text-base font-bold">Verification Progress</h3>
          <VerificationProgress status={status} />
        </div>
        <div>
          <h3 className="mb-3 font-display text-base font-bold">Why it matters</h3>
          <VerificationBenefits />
        </div>
      </div>
    </section>
  )
}

export function VerificationStatusGuide() {
  return (
    <div className="grid gap-3">
      {statusOrder.map((status) => {
        const content = landlordVerificationStatuses[status]
        return (
          <article key={status} className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <LandlordVerificationBadge status={status} />
              <p className="font-display font-semibold">{content.description}</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.detail}</p>
          </article>
        )
      })}
    </div>
  )
}

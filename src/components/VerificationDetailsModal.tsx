import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { LandlordVerificationBadge, VerificationProgress, VerificationBenefits } from '@/components/LandlordVerification'
import { VerificationStatusDetail } from '@/components/VerificationStatusDetail'
import { ShieldCheck, X } from 'lucide-react'
import type { LandlordTrustStatus } from '@/lib/listings'

export function VerificationDetailsModal({
  status,
  trustScore,
  riskScore,
  reportCount,
  isOpen,
  onOpenChange,
}: {
  status: LandlordTrustStatus
  trustScore?: number | null
  riskScore?: number | null
  reportCount?: number | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="text-left">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <AlertDialogTitle className="text-xl sm:text-2xl">Landlord Verification</AlertDialogTitle>
              <AlertDialogDescription>Understand your verification status and how to improve</AlertDialogDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rk-focus rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </AlertDialogHeader>

        {/* Current Status Section */}
        <div className="space-y-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Your Status</p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <LandlordVerificationBadge status={status} />
              <p className="text-sm text-muted-foreground">Review your verification details below</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Trust Score</p>
              <p className="font-display text-xl font-bold">{trustScore ?? 40}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Risk Score</p>
              <p className="font-display text-xl font-bold">{riskScore ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Reports</p>
              <p className="font-display text-xl font-bold">{reportCount ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="border-t" />

        {/* Status Details */}
        <div className="space-y-4 py-4">
          <VerificationStatusDetail status={status} />
        </div>

        <div className="border-t" />

        {/* Progress */}
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-display font-bold text-base mb-3">Verification Progress</h3>
            <VerificationProgress status={status} />
          </div>
        </div>

        <div className="border-t" />

        {/* Benefits */}
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-display font-bold text-base mb-3">Why Verification Matters</h3>
            <VerificationBenefits />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VerificationBenefits, VerificationProgress, VerificationStatusGuide } from '@/components/LandlordVerification'
import { VerificationStatusDetail } from '@/components/VerificationStatusDetail'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { LandlordTrustStatus } from '@/lib/listings'

const allStatuses: LandlordTrustStatus[] = ['pending', 'phone_verified', 'trusted', 'suspended', 'banned']

export default function Verification() {
  return (
    <div className="bg-background">
      {/* Header */}
      <section className="border-b bg-muted/40">
        <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <Link to="/dashboard" className="rk-focus mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Verification Guide</p>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Landlord verification should be easy to understand.</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              RentaKasi uses verification status, trust signals, reports, and moderation checks to make marketplace safety visible. Your verification status helps tenants make better decisions and helps you build confidence over time.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="container mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:py-12 lg:grid-cols-2">
        <div className="rk-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold mb-3">Your Verification Path</h2>
          <p className="text-sm leading-relaxed text-muted-foreground mb-5">
            Most landlords progress from pending verification through phone verification to trusted status as they build a stronger trust record on RentaKasi.
          </p>
          <div>
            <VerificationProgress status="phone_verified" />
          </div>
        </div>

        <div className="rk-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold mb-3">Why Verification Matters</h2>
          <div>
            <VerificationBenefits />
          </div>
        </div>
      </section>

      {/* Detailed Status Explanations */}
      <section className="container mx-auto max-w-5xl px-4 pb-12">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold mb-2">What Each Status Means</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Your verification status is set from backend profile data and updated by trusted moderation processes. Here's what each means for you and your tenants.</p>
        </div>

        <div className="grid gap-4">
          {allStatuses.map((status) => (
            <VerificationStatusDetail key={status} status={status} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-muted/40 p-5 sm:p-6 border border-border">
          <h3 className="font-display font-bold text-base mb-3">Questions about your verification status?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have questions about your verification status or believe there's been an error, please contact our support team. We're here to help.
          </p>
          <Link to="/dashboard">
            <Button className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

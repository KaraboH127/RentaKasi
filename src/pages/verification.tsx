import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { VerificationBenefits, VerificationProgress, VerificationStatusGuide } from '@/components/LandlordVerification'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function Verification() {
  return (
    <div className="bg-background">
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
              RentaKasi uses verification status, trust signals, reports, and moderation checks to make marketplace safety visible. A status helps tenants make better decisions and helps landlords build confidence over time.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rk-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Verification Progress</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Most landlords move from pending review to phone verification, then to trusted status after stronger trust checks.
          </p>
          <div className="mt-5">
            <VerificationProgress status="phone_verified" />
          </div>
        </div>

        <div className="rk-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Verified landlords may</h2>
          <div className="mt-5">
            <VerificationBenefits />
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-12">
        <div className="mb-5">
          <h2 className="font-display text-xl font-bold">What each status means</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Statuses are set from backend profile data and can be updated by trusted moderation flows.</p>
        </div>
        <VerificationStatusGuide />
        <div className="mt-8">
          <Link to="/dashboard">
            <Button className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Return to dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

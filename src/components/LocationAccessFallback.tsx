import { Edit3, LocateFixed, MapPinned, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBrowserLocationHelp, type BrowserLocationHelp } from '@/lib/location'
import { cn } from '@/lib/utils'

interface LocationAccessFallbackProps {
  className?: string
  isRetrying?: boolean
  onDropPin: () => void
  onEnterManually: () => void
  onRetry: () => void
  reason?: string | null
}

export function LocationAccessFallback({ className, isRetrying = false, onDropPin, onEnterManually, onRetry, reason }: LocationAccessFallbackProps) {
  const help = getBrowserLocationHelp()

  return (
    <section className={cn('animate-in fade-in-0 slide-in-from-bottom-2 rounded-2xl border border-primary/15 bg-card p-4 shadow-sm sm:p-5', className)} aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold">Choose how to set the property location</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Location access improves map accuracy, but it is optional. You can continue with a manual address or place the pin yourself.
          </p>
          {reason && <p className="mt-2 text-sm font-medium text-foreground">{reason}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" className="h-11 justify-start gap-2" onClick={onEnterManually}>
          <Edit3 className="h-4 w-4" />
          Enter address manually
        </Button>
        <Button type="button" variant="outline" className="h-11 justify-start gap-2" onClick={onDropPin}>
          <MapPinned className="h-4 w-4" />
          Drop pin on map
        </Button>
        <Button type="button" variant="secondary" className="h-11 justify-start gap-2" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? <RefreshCw className="h-4 w-4 animate-pulse" /> : <LocateFixed className="h-4 w-4" />}
          Retry location access
        </Button>
      </div>

      <BrowserHelp help={help} />
    </section>
  )
}

function BrowserHelp({ help }: { help: BrowserLocationHelp }) {
  return (
    <div className="mt-4 rounded-xl border bg-muted/35 p-3">
      <p className="text-sm font-semibold">{help.title}</p>
      <ol className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
        {help.steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-bold text-foreground shadow-sm">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

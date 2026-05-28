import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Phone, ShieldCheck } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createReport, type ReportCategory, type ReportTargetType } from '@/lib/reports'
import { normalizeSouthAfricanPhone } from '@/lib/phone'
import { getOrCreateTenantIdentity, type TenantIdentity } from '@/lib/tenant-identity'

interface ReportDialogProps {
  children: ReactNode
  targetType: ReportTargetType
  listingId?: string
  landlordId?: string
  title: string
}

export function ReportDialog({ children, targetType, listingId, landlordId, title }: ReportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ReportCategory>('scam')
  const [details, setDetails] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [tenantIdentity, setTenantIdentity] = useState<TenantIdentity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const normalizedPhone = normalizeSouthAfricanPhone(phoneInput)

  const submitReport = async () => {
    if (!tenantIdentity && !normalizedPhone.isValid) {
      toast({ title: 'Phone verification required', description: 'Enter a valid South African mobile number before reporting.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const identity = tenantIdentity ?? await getOrCreateTenantIdentity(phoneInput)
      setTenantIdentity(identity)
      await createReport({ targetType, listingId, landlordId, category, details })
      toast({
        title: 'Report submitted',
        description: targetType === 'landlord'
          ? 'Thank you. If this landlord has repeated unique reports, their listings will be hidden for review.'
          : 'Thank you. The RentaKasi team will review this concern.',
      })
      setDetails('')
      setCategory('scam')
      setOpen(false)
    } catch (error) {
      toast({ title: 'Could not submit report', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Reports help moderation spot scams and unsafe listings. Browsing and WhatsApp contact stay open without an account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-background p-2 text-primary">
                {tenantIdentity ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">Verify to report</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Use a South African phone number so reports are tied to one lightweight tenant identity and duplicates are blocked.
                </p>
                {tenantIdentity ? (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {tenantIdentity.phoneDisplay}
                  </p>
                ) : (
                  <div className="mt-3">
                    <label className="mb-2 flex items-center gap-1 text-sm font-medium">
                      <Phone className="h-4 w-4" />
                      Phone number
                    </label>
                    <Input
                      value={phoneInput}
                      onChange={(event) => setPhoneInput(event.target.value)}
                      placeholder="067 990 6451"
                      inputMode="tel"
                      autoComplete="tel"
                      className="h-11"
                    />
                    {phoneInput && (
                      <p className={`mt-1 text-xs ${normalizedPhone.isValid ? 'text-secondary' : 'text-destructive'}`}>
                        {normalizedPhone.isValid ? `Will be saved as ${normalizedPhone.display}` : 'Enter a valid South African mobile number.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Reason</label>
            <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scam">Scam</SelectItem>
                <SelectItem value="fake_photos">Fake photos</SelectItem>
                <SelectItem value="wrong_location">Wrong location</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="dangerous">Dangerous</SelectItem>
                <SelectItem value="no_response">No response</SelectItem>
                <SelectItem value="other">Other concern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Details</label>
            <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Share what happened. Keep it factual and specific." className="min-h-24" />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              submitReport()
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit report'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

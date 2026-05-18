import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { createReport, type ReportReason, type ReportTargetType } from '@/lib/reports'

interface ReportDialogProps {
  children: ReactNode
  targetType: ReportTargetType
  listingId?: string
  landlordId?: string
  title: string
}

export function ReportDialog({ children, targetType, listingId, landlordId, title }: ReportDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [reason, setReason] = useState<ReportReason>('scam')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitReport = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: 'Sign in required', description: 'Please sign in to report a safety concern.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      await createReport(user.id, { targetType, listingId, landlordId, reason, details })
      toast({ title: 'Report submitted', description: 'Thank you. The RentaKasi team will review this concern.' })
      setDetails('')
      setReason('scam')
    } catch (error) {
      toast({ title: 'Could not submit report', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Report scams, wrong details, unsafe behavior, or listings that are no longer available.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Reason</label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scam">Possible scam or fraud</SelectItem>
                <SelectItem value="wrong_information">Wrong listing information</SelectItem>
                <SelectItem value="unavailable">Room is not available</SelectItem>
                <SelectItem value="unsafe">Unsafe or concerning behavior</SelectItem>
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
          <AlertDialogAction onClick={submitReport} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isSubmitting ? 'Submitting...' : 'Submit report'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

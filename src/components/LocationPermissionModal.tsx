import { LocationAccessFallback } from '@/components/LocationAccessFallback'

interface LocationPermissionModalProps {
  isRetrying?: boolean
  onDropPin: () => void
  onEnterManually: () => void
  onRetry: () => void
  reason?: string | null
}

export function LocationPermissionModal(props: LocationPermissionModalProps) {
  return <LocationAccessFallback {...props} />
}

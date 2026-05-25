import { MapSkeleton } from '@/components/skeletons'

export function MapSkeletonLoader({ compact = false }: { compact?: boolean }) {
  return <MapSkeleton compact={compact} />
}

import { Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonGroupProps {
  className?: string
  count?: number
}

export function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <article className={cn('rk-surface h-full overflow-hidden rounded-2xl', className)} aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="hidden h-3 w-full sm:block" />
        <Skeleton className="hidden h-3 w-4/5 sm:block" />
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12 rounded-full" />
        </div>
      </div>
    </article>
  )
}

export function PropertyCardSkeletonGrid({ className, count = 8 }: SkeletonGroupProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4', className)} aria-busy="true" aria-label="Loading properties">
      {Array.from({ length: count }).map((_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function MapSkeleton({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('rk-surface overflow-hidden rounded-2xl', className)} aria-busy="true" aria-label="Loading map">
      <div className={cn('relative bg-muted/45', compact ? 'h-56' : 'h-[360px]')}>
        <Skeleton className="absolute left-4 top-4 h-7 w-28 rounded-full" />
        <Skeleton className="absolute right-4 top-4 h-24 w-10 rounded-xl" />
        <Skeleton className="absolute left-[22%] top-[42%] h-9 w-9 rounded-full" />
        <Skeleton className="absolute left-[58%] top-[30%] h-9 w-9 rounded-full" />
        <Skeleton className="absolute left-[72%] top-[62%] h-9 w-9 rounded-full" />
        <Skeleton className="absolute inset-x-3 bottom-3 h-24 rounded-2xl sm:left-auto sm:w-80" />
      </div>
    </div>
  )
}

export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-2', className)} aria-busy="true" aria-label="Loading search controls">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Skeleton className="h-11 w-full rounded-lg sm:h-12" />
      </div>
      <Skeleton className="h-11 w-24 rounded-lg sm:h-12" />
    </div>
  )
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn('rk-surface rounded-2xl p-5 sm:p-6', className)} aria-busy="true" aria-label="Loading profile">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </section>
  )
}

export function MessageSkeleton({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('rounded-xl border bg-background p-3', className)} aria-hidden="true">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-1 h-2 w-2 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className={cn('h-3 w-full', compact && 'w-4/5')} />
          {!compact && <Skeleton className="h-3 w-24" />}
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rk-surface flex gap-3 rounded-2xl p-4 sm:gap-5 sm:p-5', className)} aria-hidden="true">
      <Skeleton className="h-16 w-20 shrink-0 rounded-xl sm:h-20 sm:w-28" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function DashboardStatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rk-surface rounded-2xl p-4 sm:p-6', className)} aria-hidden="true">
      <Skeleton className="mb-3 h-3 w-16" />
      <Skeleton className="h-8 w-20 sm:h-9" />
    </div>
  )
}

export function FullPageLoader({ label = 'Loading RentaKasi' }: { label?: string }) {
  return (
    <main className="container mx-auto px-4 py-6 sm:py-10" aria-busy="true" aria-label={label}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
      <ProfileSkeleton />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
      </div>
    </main>
  )
}

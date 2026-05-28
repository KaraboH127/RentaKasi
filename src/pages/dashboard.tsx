import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardStatSkeleton, FullPageLoader, MessageSkeleton, TableRowSkeleton } from '@/components/skeletons'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { deleteListing, getListings, refreshListing, type Listing } from '@/lib/listings'
import { deleteSavedSearch, getSavedSearches, type SavedSearch } from '@/lib/saved-searches'
import { getTenantNotifications, type TenantNotification } from '@/lib/notifications'
import { getRoomTypeLabel } from '@/lib/rental-options'
import { PlusCircle, Pencil, Trash2, MapPin, Home, LogIn, RefreshCw, Bell, ShieldCheck } from 'lucide-react'

function LandlordDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const loadListings = async () => {
    setIsLoading(true)
    try {
      setListings(await getListings({ userId }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadListings()
  }, [userId])

  const handleDelete = async (listing: Listing) => {
    setDeletingId(listing.id)
    try {
      await deleteListing(listing.id, userId)
      setListings((current) => current.filter((item) => item.id !== listing.id))
      toast({ title: 'Listing deleted' })
    } catch (error) {
      toast({ title: 'Failed to delete listing', description: error instanceof Error ? error.message : undefined, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleRefresh = async (listing: Listing) => {
    setRefreshingId(listing.id)
    try {
      await refreshListing(listing.id, userId)
      toast({ title: 'Listing refreshed', description: 'It will stay active for another 45 days.' })
      await loadListings()
    } catch (error) {
      toast({ title: 'Failed to refresh listing', description: error instanceof Error ? error.message : undefined, variant: 'destructive' })
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-10">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-1">Landlord Dashboard</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Welcome, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your room listings</p>
        </div>
        <Link to="/create-listing" aria-disabled={user?.hiddenAt ? true : undefined}>
          <Button className="gap-2 w-full sm:w-auto touch-manipulation" size="lg" data-testid="button-new-listing" disabled={!!user?.hiddenAt || user?.landlordTrustStatus === 'suspended' || user?.landlordTrustStatus === 'banned'}>
            <PlusCircle className="w-5 h-5" />
            List a Room
          </Button>
        </Link>
      </div>

      {(user?.hiddenAt || user?.landlordTrustStatus === 'suspended' || user?.landlordTrustStatus === 'banned') && (
        <div className="mb-6 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          Your public listings are paused because your landlord account has multiple reports and needs moderation review.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10" aria-busy={isLoading}>
        {isLoading ? (
          <>
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
            <DashboardStatSkeleton />
          </>
        ) : (
          <>
          <div className="rk-surface rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Listings</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary" data-testid="stat-total-listings">{listings.length}</p>
          </div>
          <div className="rk-surface rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Avg. Rent</p>
            <p className="font-display text-2xl sm:text-3xl font-bold">R{listings.length > 0 ? Math.round(listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length) : 0}</p>
          </div>
          <div className="rk-surface rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Areas</p>
            <p className="font-display text-2xl sm:text-3xl font-bold">{new Set(listings.map((listing) => listing.location)).size}</p>
          </div>
          </>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5">Your Listings</h2>

        {isLoading ? (
          <div className="flex flex-col gap-3 sm:gap-4" aria-busy="true" aria-label="Loading listings">
            {Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} />)}
          </div>
        ) : listings.length > 0 ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="rk-surface rk-card-hover rk-interactive rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-5" data-testid={`card-listing-${listing.id}`}>
                <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-muted shrink-0 cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
                  <img src={listing.images[0] || 'https://placehold.co/200x160/e3ddd8/1f242d?text=Room'} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <button type="button" className="rk-focus text-left font-display font-semibold text-sm sm:text-base leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2" onClick={() => navigate(`/listing/${listing.id}`)} data-testid={`text-listing-title-${listing.id}`}>
                      {listing.title}
                    </button>
                    <span className="font-display font-bold text-primary text-sm shrink-0">R{listing.price}<span className="text-[10px] text-muted-foreground font-sans font-normal">/mo</span></span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {listing.location}
                    </Badge>
                    <Badge variant={listing.verificationStatus === 'verified' ? 'default' : 'outline'} className="text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {listing.verificationStatus === 'verified' ? 'Verified' : 'Trust pending'}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                      Expires {listing.expiresAt ? new Date(listing.expiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : 'not set'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm touch-manipulation" onClick={() => navigate(`/listing/${listing.id}`)} data-testid={`button-view-${listing.id}`}>View</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm gap-1 touch-manipulation" onClick={() => navigate(`/edit-listing/${listing.id}`)} data-testid={`button-edit-${listing.id}`}>
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm gap-1 touch-manipulation" onClick={() => handleRefresh(listing)} disabled={refreshingId === listing.id}>
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 touch-manipulation" disabled={deletingId === listing.id} data-testid={`button-delete-${listing.id}`}>
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove "{listing.title}" from RentaKasi. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(listing)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Home className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" /></div>
            <h3 className="font-display text-lg sm:text-xl font-bold mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-sm">Start earning by listing your rooms on RentaKasi. It takes under 2 minutes.</p>
            <Link to="/create-listing"><Button className="gap-2 touch-manipulation"><PlusCircle className="w-4 h-4" />Create Your First Listing</Button></Link>
          </div>
        )}
      </div>
    </div>
  )
}

function TenantDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [notifications, setNotifications] = useState<TenantNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTenantData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [searches, updates] = await Promise.all([
        getSavedSearches(user.id),
        getTenantNotifications(user.id),
      ])
      setSavedSearches(searches)
      setNotifications(updates)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTenantData()
  }, [user?.id])

  const removeSavedSearch = async (search: SavedSearch) => {
    if (!user) return
    try {
      await deleteSavedSearch(search.id, user.id)
      setSavedSearches((current) => current.filter((item) => item.id !== search.id))
      toast({ title: 'Saved search removed' })
    } catch (error) {
      toast({ title: 'Could not remove saved search', description: error instanceof Error ? error.message : undefined, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
      <div className="mb-6 sm:mb-10">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-1">Tenant Dashboard</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Your Space</h1>
        <p className="text-muted-foreground text-sm mt-1">Saved rental preferences and updates from trusted listings</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rk-surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Saved Searches</h2>
              <p className="text-sm text-muted-foreground">Preferences power future matching notifications.</p>
            </div>
            <Link to="/listings"><Button size="sm" className="gap-2"><PlusCircle className="h-4 w-4" />Add</Button></Link>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading saved searches">{Array.from({ length: 2 }).map((_, i) => <MessageSkeleton key={i} />)}</div>
          ) : savedSearches.length > 0 ? (
            <div className="space-y-3">
              {savedSearches.map((search) => (
                <div key={search.id} className="rounded-xl border bg-background p-4 transition-colors hover:border-primary/25">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">{search.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[search.areas.join(', ') || 'All areas', search.maxPrice ? `up to R${search.maxPrice}` : 'any price', search.roomTypes.map(getRoomTypeLabel).join(', ') || 'any room type'].join(' - ')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => removeSavedSearch(search)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <Home className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-display font-semibold">No saved preferences yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Browse rooms, apply filters, then save the search to get matching updates.</p>
              <Link to="/listings"><Button className="mt-4">Browse rooms</Button></Link>
            </div>
          )}
        </section>

        <section className="rk-surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Bell className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-lg font-bold">Recent Updates</h2>
              <p className="text-sm text-muted-foreground">Listing matches, price drops, and trust updates.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading recent updates">{Array.from({ length: 3 }).map((_, i) => <MessageSkeleton key={i} compact />)}</div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 6).map((notification) => (
                <div key={notification.id} className="rounded-xl border bg-background p-3 transition-colors hover:border-primary/25">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-display font-semibold">No updates yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">When a room matches your preferences, it will appear here and in the bell.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <FullPageLoader label="Loading dashboard" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5"><LogIn className="w-8 h-8 text-muted-foreground" /></div>
        <h2 className="font-display text-2xl font-bold mb-3">Sign in Required</h2>
        <p className="text-muted-foreground mb-6 text-sm">You need to sign in to access your dashboard.</p>
        <Button onClick={() => navigate('/login')} className="touch-manipulation" data-testid="button-login">Sign In</Button>
      </div>
    )
  }

  if (user.role === 'landlord') return <LandlordDashboard userId={user.id} />
  return <TenantDashboard />
}

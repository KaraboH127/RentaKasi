import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { deleteListing, getListings, type Listing } from '@/lib/listings'
import { PlusCircle, Pencil, Trash2, MapPin, Home, LogIn } from 'lucide-react'

function LandlordDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-10">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-1">Landlord Dashboard</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Welcome, {user?.fullName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your room listings</p>
        </div>
        <Link to="/create-listing">
          <Button className="gap-2 w-full sm:w-auto touch-manipulation" size="lg" data-testid="button-new-listing">
            <PlusCircle className="w-5 h-5" />
            List a Room
          </Button>
        </Link>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="bg-card border rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Listings</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-primary" data-testid="stat-total-listings">{listings.length}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Avg. Rent</p>
            <p className="font-display text-2xl sm:text-3xl font-bold">R{listings.length > 0 ? Math.round(listings.reduce((sum, listing) => sum + listing.price, 0) / listings.length) : 0}</p>
          </div>
          <div className="bg-card border rounded-2xl p-4 sm:p-6">
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Areas</p>
            <p className="font-display text-2xl sm:text-3xl font-bold">{new Set(listings.map((listing) => listing.location)).size}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5">Your Listings</h2>

        {isLoading ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4 flex gap-4">
                <Skeleton className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <Skeleton className="h-8 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-5 hover:border-primary/30 transition-colors" data-testid={`card-listing-${listing.id}`}>
                <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-muted shrink-0 cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
                  <img src={listing.images[0] || 'https://placehold.co/200x160/e3ddd8/1f242d?text=Room'} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-display font-semibold text-sm sm:text-base leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2" onClick={() => navigate(`/listing/${listing.id}`)} data-testid={`text-listing-title-${listing.id}`}>
                      {listing.title}
                    </h3>
                    <span className="font-display font-bold text-primary text-sm shrink-0">R{listing.price}<span className="text-[10px] text-muted-foreground font-sans font-normal">/mo</span></span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {listing.location}
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                      {new Date(listing.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm touch-manipulation" onClick={() => navigate(`/listing/${listing.id}`)} data-testid={`button-view-${listing.id}`}>View</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:text-sm gap-1 touch-manipulation" onClick={() => navigate(`/edit-listing/${listing.id}`)} data-testid={`button-edit-${listing.id}`}>
                      <Pencil className="w-3 h-3" />
                      Edit
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
  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl">
      <div className="mb-6 sm:mb-10">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-1">Tenant Dashboard</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Your Space</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse and track rooms you are interested in</p>
      </div>

      <div className="bg-card border-2 border-dashed border-border rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Home className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" /></div>
        <h3 className="font-display text-lg sm:text-xl font-bold mb-2">Find your next home</h3>
        <p className="text-muted-foreground text-sm mb-5 max-w-sm">Browse hundreds of rooms across South African townships. Filter by location, price, and more.</p>
        <Link to="/listings"><Button className="gap-2 touch-manipulation">Browse All Rooms</Button></Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <div className="container mx-auto px-4 py-16"><Skeleton className="h-40 w-full rounded-2xl" /></div>
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

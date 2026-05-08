import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ListingCard } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getListingStats, getListings, type Listing } from '@/lib/listings'
import { Search, ShieldCheck, Home as HomeIcon, Map } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<{ totalListings: number; totalLocations: number; avgPrice: number } | null>(null)
  const [isListingsLoading, setIsListingsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  useEffect(() => {
    getListings({ limit: 3 })
      .then(setFeaturedListings)
      .finally(() => setIsListingsLoading(false))

    getListingStats()
      .then(setStats)
      .finally(() => setIsStatsLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    navigate(trimmed ? `/listings?search=${encodeURIComponent(trimmed)}` : '/listings')
  }

  return (
    <div className="flex flex-col flex-grow">
      <section className="relative bg-muted py-12 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm mb-4 sm:mb-6">
              South Africa's Trusted Township Rental Platform
            </span>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl leading-tight mb-4 sm:mb-6 text-foreground tracking-tight">
              Find Rooms. <br />
              <span className="text-primary">Live Safely.</span><br />
              Stay in the Kasi.
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground mb-7 sm:mb-10 max-w-2xl mx-auto px-2">
              Ditch the scattered Facebook groups. Find vetted, affordable rooms across townships in one organized place.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-xl mx-auto bg-card p-2 rounded-2xl shadow-xl shadow-black/5">
              <div className="relative flex-grow flex items-center">
                <Search className="absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by location or keyword..."
                  className="w-full pl-10 sm:pl-12 pr-3 h-12 sm:h-14 border-none text-base bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl font-semibold text-base touch-manipulation shrink-0">
                Find Rooms
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {isStatsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-4 flex flex-col items-center">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            ) : stats ? (
              <>
                <div className="bg-primary/5 rounded-xl p-4 sm:p-6 flex flex-col items-center text-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-primary mb-1">{stats.totalListings}+</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Listings</span>
                </div>
                <div className="bg-secondary/5 rounded-xl p-4 sm:p-6 flex flex-col items-center text-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-secondary mb-1">{stats.totalLocations}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Townships</span>
                </div>
                <div className="bg-muted/60 rounded-xl p-4 sm:p-6 flex flex-col items-center text-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-1">R{Math.round(stats.avgPrice)}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Price</span>
                </div>
                <div className="bg-accent rounded-xl p-4 sm:p-6 flex flex-col items-center text-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-accent-foreground mb-1">100%</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secure</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            <div className="flex flex-row sm:flex-col items-start gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 sm:mb-6">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Verified Landlords</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">No more scams. Connect directly with real property owners who care for their spaces.</p>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-start gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 sm:mb-6">
                <Map className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Location First</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Filter by specific sections within your preferred kasi. Find a room exactly where you want.</p>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-start gap-4 sm:gap-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground shrink-0 sm:mb-6">
                <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Clear Details</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Know the price, see pictures, and understand the rules before you even make a call.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-6 sm:mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Featured Rooms</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Handpicked spaces available right now.</p>
            </div>
            <Link to="/listings">
              <Button variant="outline" size="sm" className="hidden sm:flex">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {isListingsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} featured />)
            ) : (
              <div className="col-span-full py-10 text-center border-2 border-dashed rounded-xl border-border bg-card">
                <p className="text-muted-foreground">No featured listings yet.</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/listings">
              <Button variant="outline" className="w-full sm:w-auto sm:hidden">View All Rooms</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circles" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circles)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 sm:mb-6">Got an empty room?</h2>
          <p className="text-primary-foreground/80 text-base sm:text-xl max-w-2xl mx-auto mb-7 sm:mb-10 px-4">
            Join hundreds of landlords making safe, consistent income by listing on RentaKasi.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="font-semibold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 bg-background text-foreground hover:bg-background/90 touch-manipulation">
              Become a Landlord
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

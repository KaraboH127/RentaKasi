import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ListingCard } from '@/components/ListingCard'
import { ListingMap } from '@/components/ListingMap'
import { ListingsMap } from '@/components/ListingsMapGoogleMaps'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapSkeleton, PropertyCardSkeletonGrid } from '@/components/skeletons'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getListings, type Listing } from '@/lib/listings'
import { createSavedSearch } from '@/lib/saved-searches'
import { LOCATIONS, ROOM_TYPES, type RoomType } from '@/lib/rental-options'
import { cn } from '@/lib/utils'
import { BellPlus, Map, Search, X, SlidersHorizontal } from 'lucide-react'

export default function Listings() {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const searchParams = useMemo(() => new URLSearchParams(routerLocation.search), [routerLocation.search])
  const { user } = useAuth()
  const { toast } = useToast()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || '')
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '')
  const [roomType, setRoomType] = useState<string>(searchParams.get('roomType') || '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSearch, setIsSavingSearch] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [useGoogleMap, setUseGoogleMap] = useState(true)

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setSelectedLocation(searchParams.get('location') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setRoomType(searchParams.get('roomType') || '')
  }, [searchParams])

  useEffect(() => {
    setIsLoading(true)
    getListings({
      search: searchParams.get('search') || undefined,
      location: searchParams.get('location') || undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      roomType: (searchParams.get('roomType') || undefined) as RoomType | undefined,
    })
      .then(setListings)
      .finally(() => setIsLoading(false))
  }, [searchParams])

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (selectedLocation && selectedLocation !== 'all') params.set('location', selectedLocation)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (roomType && roomType !== 'all') params.set('roomType', roomType)
    const queryString = params.toString()
    navigate(queryString ? `/listings?${queryString}` : '/listings')
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedLocation('all')
    setMaxPrice('')
    setRoomType('')
    setFiltersOpen(false)
    navigate('/listings')
  }

  const saveSearch = async () => {
    if (!user || user.role !== 'tenant') {
      toast({ title: 'Tenant account required', description: 'Sign in as a tenant to save rental preferences.', variant: 'destructive' })
      return
    }
    setIsSavingSearch(true)
    try {
      await createSavedSearch(user.id, {
        name: selectedLocation && selectedLocation !== 'all' ? `${selectedLocation} rooms` : search.trim() || 'My rental search',
        areas: selectedLocation && selectedLocation !== 'all' ? [selectedLocation] : [],
        maxPrice: maxPrice ? Number(maxPrice) : null,
        roomTypes: roomType && roomType !== 'all' ? [roomType as RoomType] : [],
        keywords: search.trim() || null,
      })
      toast({ title: 'Search saved', description: 'Matching rooms can now trigger tenant notifications.' })
    } catch (error) {
      toast({ title: 'Could not save search', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSavingSearch(false)
    }
  }

  const activeFilterCount = (selectedLocation && selectedLocation !== 'all' ? 1 : 0) + (maxPrice ? 1 : 0) + (roomType && roomType !== 'all' ? 1 : 0)

  return (
    <div className="flex flex-col flex-grow bg-muted/20">
      <div className="sticky top-14 z-40 border-b bg-card/95 shadow-sm shadow-black/[0.02] backdrop-blur md:top-16">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="hidden sm:flex justify-between items-center mb-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">Browse Rooms</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Find your next space in the kasi.</p>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive gap-1">
                <X className="w-4 h-4" />
                Clear filters
              </Button>
            )}
          </div>

          <form onSubmit={handleFilter} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search rooms..."
                  className="pl-9 h-11 sm:h-12 w-full text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  inputMode="search"
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={cn(
                  'rk-focus rk-interactive flex items-center gap-1.5 px-3 h-11 sm:h-12 rounded-lg border text-sm font-semibold shrink-0 touch-manipulation',
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/50',
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className={cn('w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center', filtersOpen ? 'bg-primary-foreground text-primary' : 'bg-primary-foreground/20 text-primary-foreground')}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {filtersOpen && (
              <div className="flex flex-col gap-2 pt-3 pb-1 border-t border-border/50 mt-1 animate-in fade-in-0 slide-in-from-top-1 duration-150 sm:flex-row">
                <Select value={selectedLocation || 'all'} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-11 sm:h-12 w-full sm:w-48">
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={maxPrice || 'all'} onValueChange={(val) => setMaxPrice(val === 'all' ? '' : val)}>
                  <SelectTrigger className="h-11 sm:h-12 w-full sm:w-44">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any price</SelectItem>
                    <SelectItem value="1500">R1,500 or less</SelectItem>
                    <SelectItem value="2500">R2,500 or less</SelectItem>
                    <SelectItem value="3500">R3,500 or less</SelectItem>
                    <SelectItem value="5000">R5,000 or less</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roomType || 'all'} onValueChange={(val) => setRoomType(val === 'all' ? '' : val)}>
                  <SelectTrigger className="h-11 sm:h-12 w-full sm:w-44">
                    <SelectValue placeholder="Any room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any room type</SelectItem>
                    {ROOM_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex gap-2 sm:ml-auto">
                  <Button type="submit" className="flex-1 sm:flex-none h-11 sm:h-12 touch-manipulation gap-2">
                    <Search className="w-4 h-4" />
                    Apply Filters
                  </Button>
                  {activeFilterCount > 0 && (
                    <Button type="button" variant="outline" className="h-11 sm:h-12 px-4 touch-manipulation gap-1.5 text-muted-foreground" onClick={clearFilters}>
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-8 flex-grow">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h1 className="font-display text-xl font-bold sm:hidden">Browse Rooms</h1>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setMapOpen((value) => !value)} aria-pressed={mapOpen}>
              <Map className="h-4 w-4" />
              {mapOpen ? 'Hide map' : 'Map'}
            </Button>
            {user?.role === 'tenant' && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={saveSearch} disabled={isSavingSearch}>
                <BellPlus className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
          <Badge variant="secondary" className="font-normal text-xs sm:text-sm px-2.5 py-1">
            {isLoading ? <span className="block h-3 w-20 rounded rk-skeleton" aria-hidden="true" /> : `${listings.length} rooms found`}
          </Badge>
        </div>

        {mapOpen && (isLoading ? <MapSkeleton className="mb-5 sm:mb-8" /> : useGoogleMap ? <ListingsMap listings={listings} selectedListingId={selectedListingId} onListingClick={setSelectedListingId} className="mb-5 sm:mb-8" /> : <ListingMap listings={listings} className="mb-5 sm:mb-8" />)}

        {isLoading ? (
          <PropertyCardSkeletonGrid />
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 animate-in fade-in-0 duration-300">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-dashed text-center max-w-md mx-auto mt-6">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">No rooms found</h3>
            <p className="text-muted-foreground text-sm mb-5 px-4">Try adjusting your filters or browse all available rooms.</p>
            <Button variant="outline" onClick={clearFilters} className="touch-manipulation">Show all rooms</Button>
          </div>
        )}
      </div>
    </div>
  )
}

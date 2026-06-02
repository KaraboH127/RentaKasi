import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapSkeleton, ProfileSkeleton } from '@/components/skeletons'
import { ListingMap } from '@/components/ListingMap'
import { DetailMap } from '@/components/DetailMap'
import { ReportDialog } from '@/components/ReportDialog'
import { TrustBadges } from '@/components/TrustBadges'
import { LandlordVerificationBadge, landlordVerificationStatuses } from '@/components/LandlordVerification'
import { getListingById, type Listing } from '@/lib/listings'
import { buildWhatsAppUrl, normalizeSouthAfricanPhone } from '@/lib/phone'
import { getRoomTypeLabel } from '@/lib/rental-options'
import { MapPin, Phone, ArrowLeft, Home, Calendar, Flag, ShieldCheck, Navigation } from 'lucide-react'

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getListingById(id)
      .then((data) => {
        setListing(data)
        setIsError(false)
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl" aria-busy="true" aria-label="Loading listing details">
        <div className="mb-6 h-7 w-36 rounded-md rk-skeleton" />
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="aspect-[4/3] rounded-2xl rk-skeleton" />
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-square rounded-lg rk-skeleton" />)}
            </div>
          </div>
          <div className="space-y-4 md:col-span-2">
            <div className="h-6 w-28 rounded-full rk-skeleton" />
            <div className="h-8 w-4/5 rounded-md rk-skeleton" />
            <div className="h-10 w-32 rounded-md rk-skeleton" />
            <div className="h-32 rounded-2xl rk-skeleton" />
            <MapSkeleton compact />
            <ProfileSkeleton />
            <div className="h-14 rounded-xl rk-skeleton" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !listing) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Listing Not Found</h2>
        <p className="text-muted-foreground mb-6">This listing may have been removed or does not exist.</p>
        <Button onClick={() => navigate('/listings')} className="touch-manipulation">Browse All Rooms</Button>
      </div>
    )
  }

  const images = listing.images.length > 0 ? listing.images : ['https://placehold.co/800x600/e3ddd8/1f242d?text=No+Image']
  const contactName = listing.landlordName || 'there'
  const phone = normalizeSouthAfricanPhone(listing.landlordPhone)
  const whatsappMessage = `Hi ${contactName}, I am interested in the room you listed on RentaKasi: "${listing.title}" in ${listing.location} for R${listing.price}/month. Is it still available?`
  const whatsappUrl = buildWhatsAppUrl(listing.landlordPhone, whatsappMessage) ?? '#'
  const formattedDate = new Date(listing.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  const landlordVerification = landlordVerificationStatuses[listing.landlordTrustStatus]

  return (
    <div className="bg-background min-h-screen pb-4 md:pb-20">
      <div className="border-b bg-card/80 backdrop-blur sticky top-14 md:top-16 z-40">
        <div className="container mx-auto px-4 py-3">
          <button onClick={() => navigate('/listings')} className="rk-focus flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-manipulation" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Listings
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-10 max-w-5xl pb-32 md:pb-0">
        <div className="grid md:grid-cols-5 gap-6 lg:gap-16">
          <div className="md:col-span-3">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[4/3] mb-2 sm:mb-4 shadow-sm ring-1 ring-border/60">
              <img src={images[activeImage]} alt={listing.title} className="w-full h-full object-cover transition-opacity duration-200" loading="eager" data-testid="img-listing-main" />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`rk-focus rounded-lg overflow-hidden aspect-square border-2 transition-all touch-manipulation ${activeImage === i ? 'border-primary shadow-md opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-primary/30'}`}
                    data-testid={`button-thumb-${i}`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.location}
              </Badge>
              <Badge variant="outline">{getRoomTypeLabel(listing.roomType)}</Badge>
              <TrustBadges listing={listing} />
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3 leading-tight" data-testid="text-listing-title">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-2 mb-3 sm:mb-5">
              <span className="font-display text-3xl sm:text-4xl font-bold text-primary" data-testid="text-listing-price">R{listing.price}</span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              <Calendar className="w-4 h-4 shrink-0" />
              Listed on {formattedDate}
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">About this Room</h3>
              <p className="text-foreground leading-relaxed text-sm sm:text-base" data-testid="text-listing-description">{listing.description}</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border border-border/60">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">Location</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {listing.location}, South Africa
                </div>
                {listing.landmark && <p className="text-muted-foreground">Landmark: {listing.landmark}</p>}
                {listing.taxiRouteProximity && <p className="text-muted-foreground">Taxi route: {listing.taxiRouteProximity}</p>}
                {listing.transportInfo && <p className="text-muted-foreground">Transport: {listing.transportInfo}</p>}
              </div>
              {listing.latitude !== null && listing.longitude !== null ? (
                <DetailMap listing={listing} className="mt-4" />
              ) : (
                <ListingMap listings={[listing]} compact className="mt-4" />
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">Listed By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                  {contactName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base" data-testid="text-landlord-name">{contactName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {phone.isValid ? phone.display : 'Phone available after landlord updates profile'}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border bg-background/70 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <LandlordVerificationBadge status={listing.landlordTrustStatus} publicLabel />
                  <span className="text-xs font-medium text-muted-foreground">Landlord trust status</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{landlordVerification.detail}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 sm:p-5 mb-5 sm:mb-6">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <div>
                  <p className="font-display font-semibold text-sm">Trust check</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Meet in person, verify the property, and never pay a deposit before you are sure the room and landlord details are real.
                  </p>
                  {listing.lastVerifiedAt && (
                    <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                      Last verified {new Date(listing.lastVerifiedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="button-contact-whatsapp" className="hidden md:block pointer-events-auto" aria-disabled={!phone.isValid}>
              <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 rounded-xl touch-manipulation" disabled={!phone.isValid}>
                <WhatsAppIcon />
                Contact via WhatsApp
              </Button>
            </a>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ReportDialog targetType="listing" listingId={listing.id} landlordId={listing.userId} title="Report this listing">
                <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                  <Flag className="h-4 w-4" />
                  Report listing
                </Button>
              </ReportDialog>
              <ReportDialog targetType="landlord" listingId={listing.id} landlordId={listing.userId} title="Report this landlord">
                <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                  <Flag className="h-4 w-4" />
                  Report landlord
                </Button>
              </ReportDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 inset-x-0 px-4 py-3 bg-card/95 backdrop-blur-sm border-t border-border z-40">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="button-contact-whatsapp-mobile" aria-disabled={!phone.isValid}>
          <Button size="lg" className="w-full h-12 text-base font-semibold gap-2 rounded-xl touch-manipulation" disabled={!phone.isValid}>
            <WhatsAppIcon />
            Contact on WhatsApp
          </Button>
        </a>
      </div>
    </div>
  )
}

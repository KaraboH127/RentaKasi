import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { createListing } from '@/lib/listings'
import { PhotoUpload } from '@/components/PhotoUpload'
import { ArrowLeft, Home, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'

const LOCATIONS = [
  'Soweto', 'Tembisa', 'Alexandra', 'Katlehong', 'Thokoza',
  'Vosloorus', 'Mamelodi', 'Soshanguve', 'Mitchells Plain',
  'Khayelitsha', 'Gugulethu', 'Nyanga',
]

const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(1, 'Please select a location'),
  price: z.string().min(1, 'Price is required').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Price must be a positive number'),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  images: z.array(z.string()).default([]),
  landlordPhone: z.string().min(10, 'Please enter a valid phone number'),
})

type CreateListingFormData = z.infer<typeof createListingSchema>

export default function CreateListing() {
  const { user, isAuthenticated, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      images: [],
      landlordPhone: user?.phone || '',
    },
  })

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Sign in Required</h2>
        <p className="text-muted-foreground mb-6">You need to sign in as a landlord to list a room.</p>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    )
  }

  if (user?.role !== 'landlord') {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Landlords Only</h2>
        <p className="text-muted-foreground mb-6">Only landlord accounts can create listings. Register as a landlord to get started.</p>
        <Link to="/register"><Button>Register as Landlord</Button></Link>
      </div>
    )
  }

  const onSubmit = async (data: CreateListingFormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const listing = await createListing(user.id, {
        title: data.title,
        description: data.description,
        location: data.location,
        price: Number(data.price),
        bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
        images: data.images,
        landlordPhone: data.landlordPhone,
      })
      await refreshProfile()
      toast({ title: 'Listing created!', description: 'Your room is now live on RentaKasi.' })
      navigate(`/listing/${listing.id}`)
    } catch (error) {
      toast({
        title: 'Failed to create listing',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-muted/20 min-h-screen pb-24">
      <div className="border-b bg-card sticky top-14 md:top-16 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-display text-lg sm:text-xl font-bold">List a Room</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-2xl">
        <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-8">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2">Create Your Listing</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">Fill in the details below to list your room on RentaKasi.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-7">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Listing Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Spacious Room in Soweto with Parking" className="h-12" data-testid="input-title" {...field} /></FormControl>
                  <FormDescription>A clear title helps tenants find your listing</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Township</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12" data-testid="select-location"><SelectValue placeholder="Select township" /></SelectTrigger></FormControl>
                      <SelectContent>{LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent (R)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">R</span>
                        <Input type="number" placeholder="2500" className="h-12 pl-8" data-testid="input-price" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="bedrooms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl><Input type="number" min="0" placeholder="1" className="h-12" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bathrooms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl><Input type="number" min="0" placeholder="1" className="h-12" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the room: size, amenities, rules, what is included, nearby facilities..." className="min-h-[130px] resize-y" data-testid="textarea-description" {...field} /></FormControl>
                  <FormDescription>Be detailed - tenants want to know exactly what they are getting</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="landlordPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Phone className="w-4 h-4" /> WhatsApp / Phone Number</FormLabel>
                  <FormControl><Input placeholder="+27 71 234 5678" className="h-12" data-testid="input-phone" {...field} /></FormControl>
                  <FormDescription>Tenants will contact you via this number on WhatsApp</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="images" render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <PhotoUpload value={field.value} onChange={field.onChange} maxPhotos={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" size="lg" className="w-full h-13 font-semibold text-base mt-2" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

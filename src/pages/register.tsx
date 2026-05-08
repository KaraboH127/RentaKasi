import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowRight, Home, Key } from 'lucide-react'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['landlord', 'tenant']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'tenant' },
  })

  const selectedRole = form.watch('role')

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      const user = await signUp(data)
      toast({ title: `Welcome to RentaKasi, ${user?.fullName || data.fullName}` })
      navigate(data.role === 'landlord' ? '/dashboard' : '/listings')
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Could not create account. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-grow min-h-full">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-background p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lines" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lines)" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-display font-bold text-xl mb-16">
            <Building2 className="w-6 h-6" />
            RentaKasi
          </div>
          <p className="text-background/50 text-sm font-medium uppercase tracking-widest mb-4">Join Today</p>
          <h2 className="font-display text-4xl font-bold leading-snug mb-8">
            Your next home<br />
            is one search away.
          </h2>

          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold mb-1">Landlords</p>
                <p className="text-background/60 text-sm leading-relaxed">List your rooms and connect with reliable tenants across South African townships.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold mb-1">Tenants</p>
                <p className="text-background/60 text-sm leading-relaxed">Browse verified listings, filter by location and price, and contact landlords directly.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-background/40 text-sm">Free to use - forever.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 font-display font-bold text-xl text-primary mb-10">
            <Building2 className="w-6 h-6" />
            RentaKasi
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-muted-foreground mb-8">Join thousands using RentaKasi across South Africa</p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              type="button"
              onClick={() => form.setValue('role', 'tenant')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedRole === 'tenant' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              data-testid="button-role-tenant"
            >
              <Home className="w-5 h-5 mb-2 text-primary" />
              <p className="font-semibold text-sm">I'm looking for a room</p>
              <p className="text-xs text-muted-foreground mt-1">Tenant</p>
            </button>
            <button
              type="button"
              onClick={() => form.setValue('role', 'landlord')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedRole === 'landlord' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              data-testid="button-role-landlord"
            >
              <Key className="w-5 h-5 mb-2 text-secondary" />
              <p className="font-semibold text-sm">I have rooms to rent</p>
              <p className="text-xs text-muted-foreground mt-1">Landlord</p>
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Thabo Nkosi" className="h-12" data-testid="input-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="h-12" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" className="h-12" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">Minimum 6 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full h-12 font-semibold text-base gap-2 mt-2" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? 'Creating account...' : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </Form>

          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="link-login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

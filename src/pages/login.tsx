import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const user = await signIn(data.email, data.password)
      toast({ title: `Welcome back, ${user?.fullName || 'there'}` })
      navigate(user?.role === 'landlord' ? '/dashboard' : '/listings')
    } catch {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-grow min-h-full">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary text-primary-foreground p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 font-display font-bold text-xl mb-16">
            <Building2 className="w-6 h-6" />
            RentaKasi
          </div>
          <div>
            <p className="text-primary-foreground/60 text-sm font-medium uppercase tracking-widest mb-4">Township Rentals</p>
            <h2 className="font-display text-4xl font-bold leading-snug mb-6">
              Find Rooms.<br />
              Live Safely.<br />
              Stay in the Kasi.
            </h2>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">South Africa's most trusted platform for township room rentals.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-8">
          <div>
            <p className="font-display text-3xl font-bold">100+</p>
            <p className="text-primary-foreground/60 text-sm">Active listings</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold">12+</p>
            <p className="text-primary-foreground/60 text-sm">Townships</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 font-display font-bold text-xl text-primary mb-10">
            <Building2 className="w-6 h-6" />
            RentaKasi
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-10">Sign in to your RentaKasi account</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
                      <Input type="password" placeholder="Enter your password" className="h-12" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full h-12 font-semibold text-base gap-2" disabled={isSubmitting} data-testid="button-submit">
                {isSubmitting ? 'Signing in...' : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </Form>

          <p className="text-center text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline" data-testid="link-register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationBell } from '@/components/NotificationBell'
import { LogOut, User as UserIcon, PlusCircle, Building2 } from 'lucide-react'

export function Navbar() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinkClass = (href: string) => {
    const active = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)
    return `relative flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 shadow-sm shadow-black/[0.02] backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="rk-focus flex min-h-10 items-center gap-2 rounded-full font-display font-bold text-lg text-primary touch-manipulation md:text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </span>
          RentaKasi
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link to="/listings" className={navLinkClass('/listings')}>
            Browse Rooms
          </Link>

          {loading ? (
            <div className="flex items-center gap-3 border-l pl-4 ml-2" aria-busy="true" aria-label="Loading navigation">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 border-l pl-4 ml-2">
              <NotificationBell />
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <UserIcon className="w-4 h-4" />
                Dashboard
              </Link>

              {user.role === 'landlord' && (
                <Link to="/create-listing" className={navLinkClass('/create-listing')}>
                  <PlusCircle className="w-4 h-4" />
                  List a Room
                </Link>
              )}

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l pl-4 ml-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </nav>

        <div className="md:hidden flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-9 w-24 rounded-full" />
          ) : user ? (
            <>
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground h-9 px-3">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/register">
              <Button size="sm" className="h-9 px-4 text-sm">Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

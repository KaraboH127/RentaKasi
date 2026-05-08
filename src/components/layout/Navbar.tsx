import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon, PlusCircle, Building2 } from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg md:text-xl text-primary touch-manipulation">
          <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          RentaKasi
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/listings" className="text-sm font-medium hover:text-primary transition-colors">
            Browse Rooms
          </Link>

          {user ? (
            <div className="flex items-center gap-4 border-l pl-4 ml-2">
              <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Dashboard
              </Link>

              {user.role === 'landlord' && (
                <Link to="/create-listing" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
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
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground h-9 px-3">
              <LogOut className="w-4 h-4" />
            </Button>
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

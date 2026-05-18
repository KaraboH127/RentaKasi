import { Link, useLocation } from 'react-router-dom'
import { Home, Search, LayoutDashboard, PlusCircle, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  type NavItem = { href: string; icon: React.ElementType; label: string; accent?: boolean }

  const items: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/listings', icon: Search, label: 'Browse' },
  ]

  if (isAuthenticated && user?.role === 'landlord') {
    items.push({ href: '/create-listing', icon: PlusCircle, label: 'List Room', accent: true })
  }

  if (isAuthenticated) {
    items.push({ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' })
  } else {
    items.push({ href: '/login', icon: LogIn, label: 'Sign In' })
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex h-16">
        {items.map(({ href, icon: Icon, label, accent }) => {
          const isActive = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation select-none rk-focus',
                accent ? 'text-primary' : isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && <span className="absolute top-1.5 h-1 w-8 rounded-full bg-primary/80" />}
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive || accent ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

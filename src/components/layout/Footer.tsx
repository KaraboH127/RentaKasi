import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-card border-t py-8 md:py-12 mt-auto hidden md:block">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-primary mb-3">
              <Building2 className="w-5 h-5" />
              RentaKasi
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Find Rooms. Live Safely. Stay in the Kasi. The trusted platform for township room rentals across South Africa.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3 text-foreground text-sm">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/listings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse Listings</Link></li>
              <li><Link to="/listings?location=Soweto" className="text-sm text-muted-foreground hover:text-primary transition-colors">Rooms in Soweto</Link></li>
              <li><Link to="/listings?location=Tembisa" className="text-sm text-muted-foreground hover:text-primary transition-colors">Rooms in Tembisa</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3 text-foreground text-sm">Company</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">About Us</span></li>
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">Contact Support</span></li>
              <li><span className="text-sm text-muted-foreground cursor-not-allowed">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} RentaKasi. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with intention.</p>
        </div>
      </div>
    </footer>
  )
}

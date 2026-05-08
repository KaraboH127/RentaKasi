import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'

import Home from '@/pages/home'
import Listings from '@/pages/listings'
import ListingDetail from '@/pages/listing-detail'
import CreateListing from '@/pages/create-listing'
import EditListing from '@/pages/edit-listing'
import Dashboard from '@/pages/dashboard'
import Login from '@/pages/login'
import Register from '@/pages/register'
import NotFound from '@/pages/not-found'

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-[100dvh] flex flex-col">
            <Navbar />
            <main className="flex-grow flex flex-col pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/create-listing" element={<CreateListing />} />
                <Route path="/edit-listing/:id" element={<EditListing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <BottomNav />
          </div>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  )
}

export default App

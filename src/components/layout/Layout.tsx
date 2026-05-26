import { Outlet } from 'react-router-dom'
import { BackgroundEffects } from '../effects/BackgroundEffects'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="relative min-h-screen">
      <BackgroundEffects />
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

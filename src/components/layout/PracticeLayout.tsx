import { Outlet } from 'react-router-dom'
import { BackgroundEffects } from '../effects/BackgroundEffects'
import { Navbar } from './Navbar'

export function PracticeLayout() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <BackgroundEffects />
      <Navbar />
      <main className="min-h-0 flex-1 px-4 pt-20 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

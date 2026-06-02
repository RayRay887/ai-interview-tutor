import { Outlet } from 'react-router-dom'
import { BackgroundEffects } from '../effects/BackgroundEffects'
import { Navbar } from './Navbar'

export function PracticeLayout() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <BackgroundEffects />
      <Navbar />
      <main className="min-h-0 flex-1 px-2 pt-[4.5rem] pb-2 sm:px-3 lg:px-4">
        <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

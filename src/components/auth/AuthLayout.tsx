import { Outlet } from 'react-router-dom'
import { PrepifyLogo } from '../brand/PrepifyLogo'
import { BackgroundEffects } from '../effects/BackgroundEffects'
import { Particles } from '../effects/Particles'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <BackgroundEffects />
      <Particles count={25} />

      <div className="relative mb-8">
        <PrepifyLogo size="lg" linked={false} />
      </div>

      <Outlet />

      <p className="relative mt-8 max-w-sm text-center text-xs text-text-secondary/80">
        Sign in with email and password, then enter the 6-digit code Supabase sends to your inbox.
      </p>
    </div>
  )
}

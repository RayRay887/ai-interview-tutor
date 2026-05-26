import { Sparkles } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { BackgroundEffects } from '../effects/BackgroundEffects'
import { Particles } from '../effects/Particles'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <BackgroundEffects />
      <Particles count={25} />

      <div className="relative mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-accent-blue to-accent-purple shadow-lg shadow-accent-blue/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-semibold tracking-tight text-text-primary">Prepify</span>
      </div>

      <Outlet />

      <p className="relative mt-8 max-w-sm text-center text-xs text-text-secondary/80">
        Accounts are stored locally in your browser for this demo. A secure backend will be added
        later.
      </p>
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Mail, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GradientText } from '../components/ui/GradientText'
import { PasswordInput } from '../components/ui/PasswordInput'

type AuthMode = 'signin' | 'signup'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<AuthMode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(name, email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="glass glow-blue relative w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">
          {mode === 'signin' ? (
            <>
              Sign in to <GradientText as="span">Prepify</GradientText>
            </>
          ) : (
            <>
              Create your <GradientText as="span">account</GradientText>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {mode === 'signin'
            ? 'Access your practice questions and mock interview sessions.'
            : 'Join Prepify and start your mock interview journey.'}
        </p>
      </div>

      <div className="mb-6 flex rounded-lg border border-white/10 bg-bg-primary/50 p-1">
        {(['signin', 'signup'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchMode(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === tab
                ? 'bg-linear-to-r from-accent-blue to-accent-purple text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {mode === 'signup' && (
            <motion.div
              key="name-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Full name
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Chen"
                  autoComplete="name"
                  className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Email</label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50"
            />
          </div>
        </div>

        <PasswordInput
          id="auth-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
          required
          minLength={mode === 'signup' ? 6 : 1}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          key={mode}
        />

        {error && (
          <motion.p
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </motion.div>
  )
}

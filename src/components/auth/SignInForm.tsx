import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Lock, Mail, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth, type OtpPurpose } from '../../context/AuthContext'
import { GradientText } from '../ui/GradientText'
import { OtpInput } from './OtpInput'

type AuthMode = 'signin' | 'signup'
type AuthStep = 'credentials' | 'otp'

interface SignInFormProps {
  onSuccess?: () => void
  initialMode?: AuthMode
}

export function SignInForm({ onSuccess, initialMode = 'signin' }: SignInFormProps) {
  const { signUp, signIn, verifyOtp, resendOtp } = useAuth()

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<AuthStep>('credentials')
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setStep('credentials')
    setOtp('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleCredentials = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        await signUp(name, email, password)
        setOtpPurpose('signup')
      } else {
        await signIn(email, password)
        setOtpPurpose('signin')
      }
      setStep('otp')
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await verifyOtp(email, otp, otpPurpose)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await resendOtp(email, otpPurpose)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">
          {step === 'otp' ? (
            <>Check your <GradientText as="span">email</GradientText></>
          ) : mode === 'signin' ? (
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
          {step === 'otp'
            ? `We sent a 6-digit code to ${email}`
            : mode === 'signin'
              ? 'Enter your email and password to continue.'
              : 'Create an account with your email and password.'}
        </p>
      </div>

      {step === 'credentials' && (
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
      )}

      {step === 'credentials' ? (
        <form onSubmit={handleCredentials} className="space-y-4">
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
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Alex Chen"
                    autoComplete="name"
                    required
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
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                required
                minLength={mode === 'signup' ? 6 : 1}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50"
                />
              </div>
            </div>
          )}

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
            {isSubmitting ? 'Please wait…' : 'Continue'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label className="mb-3 block text-center text-xs font-medium text-text-secondary">
              6-digit verification code
            </label>
            <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />
          </div>

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
            disabled={isSubmitting || otp.replace(/\D/g, '').length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Verifying…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('credentials')
                setOtp('')
                setError(null)
              }}
              className="inline-flex items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="text-accent-blue transition-colors hover:text-accent-blue/80 disabled:opacity-60"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

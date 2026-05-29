import type { EmailOtpType, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isSupabaseConfigured, normalizeEmail, supabase } from '../lib/supabase'

export interface SessionUser {
  id: string
  name: string
  email: string
}

export type OtpPurpose = 'signup'

interface AuthContextValue {
  user: SessionUser | null
  isLoading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  verifyOtp: (email: string, token: string, purpose: OtpPurpose) => Promise<void>
  resendOtp: (email: string, purpose: OtpPurpose) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toSessionUser(user: User): SessionUser {
  const name =
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
    user.email?.split('@')[0] ||
    'User'

  return {
    id: user.id,
    name,
    email: user.email ?? '',
  }
}

function toOtpType(_purpose: OtpPurpose): EmailOtpType {
  return 'signup'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ? toSessionUser(session.user) : null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toSessionUser(session.user) : null)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Add your credentials to .env.')
    }

    const trimmedName = name.trim()
    const normalized = normalizeEmail(email)

    if (!trimmedName) {
      throw new Error('Please enter your name.')
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { name: trimmedName },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    // Hold the session until the email code is verified.
    if (data.session) {
      await supabase.auth.signOut()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Add your credentials to .env.')
    }

    const normalized = normalizeEmail(email)

    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const verifyOtp = useCallback(async (email: string, token: string, purpose: OtpPurpose) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Add your credentials to .env.')
    }

    const normalized = normalizeEmail(email)
    const code = token.replace(/\D/g, '')

    if (code.length !== 6) {
      throw new Error('Enter the 6-digit verification code from your email.')
    }

    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: code,
      type: toOtpType(purpose),
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const resendOtp = useCallback(async (email: string, purpose: OtpPurpose) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Add your credentials to .env.')
    }

    if (purpose !== 'signup') {
      throw new Error('Verification codes are only used when creating an account.')
    }

    const normalized = normalizeEmail(email)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalized,
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, signUp, signIn, verifyOtp, resendOtp, signOut }),
    [user, isLoading, signUp, signIn, verifyOtp, resendOtp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

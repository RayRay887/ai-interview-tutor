import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearSession,
  getSession,
  getStoredUsers,
  normalizeEmail,
  saveStoredUsers,
  setSession,
  type SessionUser,
  type StoredUser,
} from '../lib/authStorage'

interface AuthContextValue {
  user: SessionUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toSession(user: StoredUser): SessionUser {
  return { id: user.id, name: user.name, email: user.email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getSession())
    setIsLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const normalized = normalizeEmail(email)
    const found = getStoredUsers().find(
      (u) => u.email === normalized && u.password === password,
    )
    if (!found) {
      throw new Error('Invalid email or password.')
    }
    const session = toSession(found)
    setSession(session)
    setUser(session)
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const trimmedName = name.trim()
    const normalized = normalizeEmail(email)

    if (!trimmedName) {
      throw new Error('Please enter your name.')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    const users = getStoredUsers()
    if (users.some((u) => u.email === normalized)) {
      throw new Error('An account with this email already exists.')
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: trimmedName,
      email: normalized,
      password,
    }

    saveStoredUsers([...users, newUser])
    const session = toSession(newUser)
    setSession(session)
    setUser(session)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut],
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

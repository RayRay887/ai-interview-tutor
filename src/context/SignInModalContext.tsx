import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInModal } from '../components/auth/SignInModal'

interface OpenSignInOptions {
  redirectTo?: string
  onSuccess?: () => void
  onCancel?: () => void
  initialMode?: 'signin' | 'signup'
}

interface SignInModalContextValue {
  openSignIn: (options?: OpenSignInOptions) => void
  closeSignIn: () => void
  isOpen: boolean
}

const SignInModalContext = createContext<SignInModalContextValue | null>(null)

export function SignInModalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [initialMode, setInitialMode] = useState<'signin' | 'signup'>('signin')
  const optionsRef = useRef<OpenSignInOptions>({})

  const closeSignIn = useCallback((invokeCancel = true) => {
    if (invokeCancel) {
      optionsRef.current.onCancel?.()
    }
    setIsOpen(false)
    optionsRef.current = {}
  }, [])

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    optionsRef.current = options ?? {}
    setInitialMode(options?.initialMode ?? 'signin')
    setIsOpen(true)
  }, [])

  const handleSuccess = useCallback(() => {
    const { onSuccess, redirectTo } = optionsRef.current
    onSuccess?.()
    closeSignIn(false)
    if (redirectTo) {
      navigate(redirectTo)
    }
  }, [closeSignIn, navigate])

  const value = useMemo(
    () => ({ openSignIn, closeSignIn: () => closeSignIn(true), isOpen }),
    [openSignIn, closeSignIn, isOpen],
  )

  return (
    <SignInModalContext.Provider value={value}>
      {children}
      <SignInModal
        isOpen={isOpen}
        onClose={() => closeSignIn(true)}
        onSuccess={handleSuccess}
        initialMode={initialMode}
      />
    </SignInModalContext.Provider>
  )
}

export function useSignInModal() {
  const ctx = useContext(SignInModalContext)
  if (!ctx) {
    throw new Error('useSignInModal must be used within SignInModalProvider')
  }
  return ctx
}

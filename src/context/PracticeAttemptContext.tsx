import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import type { FinalizeAttemptSnapshot } from '../lib/practiceAttempts'

type AbandonHandler = () => Promise<void>

interface PracticeAttemptContextValue {
  attemptId: string | null
  registerAbandonHandler: (handler: AbandonHandler | null) => void
  abandonSession: () => Promise<void>
}

const PracticeAttemptContext = createContext<PracticeAttemptContextValue | null>(null)

export function PracticeAttemptProvider({
  attemptId,
  children,
}: {
  attemptId: string | null
  children: ReactNode
}) {
  const abandonHandlerRef = useRef<AbandonHandler | null>(null)

  const registerAbandonHandler = useCallback((handler: AbandonHandler | null) => {
    abandonHandlerRef.current = handler
  }, [])

  const abandonSession = useCallback(async () => {
    if (abandonHandlerRef.current) {
      await abandonHandlerRef.current()
    }
  }, [])

  const value = useMemo(
    () => ({ attemptId, registerAbandonHandler, abandonSession }),
    [attemptId, registerAbandonHandler, abandonSession],
  )

  return (
    <PracticeAttemptContext.Provider value={value}>{children}</PracticeAttemptContext.Provider>
  )
}

export function usePracticeAttempt() {
  const ctx = useContext(PracticeAttemptContext)
  if (!ctx) {
    throw new Error('usePracticeAttempt must be used within PracticeAttemptProvider')
  }
  return ctx
}

export function usePracticeAttemptOptional() {
  return useContext(PracticeAttemptContext)
}

export type { FinalizeAttemptSnapshot }

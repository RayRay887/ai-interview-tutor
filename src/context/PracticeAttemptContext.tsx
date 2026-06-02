import { AnimatePresence, motion } from 'framer-motion'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type AbandonHandler = () => Promise<void>
type SaveHandler = () => Promise<void>
type LeaveAction = () => void | Promise<void>

interface LeaveActionRef {
  onConfirm: LeaveAction
  onCancel?: () => void
}

interface PracticeAttemptContextValue {
  attemptId: string | null
  leaveProtectionEnabled: boolean
  /** Synchronous read for navigation blockers (React state may lag one frame). */
  isLeaveProtectionActive: () => boolean
  setLeaveProtectionEnabled: (enabled: boolean) => void
  registerAbandonHandler: (handler: AbandonHandler | null) => void
  registerSaveHandler: (handler: SaveHandler | null) => void
  abandonSession: () => Promise<void>
  saveSessionProgress: () => Promise<void>
  requestLeave: (action: LeaveAction) => void
  openLeaveConfirmFromBlocker: (onConfirm: LeaveAction, onCancel: () => void) => void
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
  const saveHandlerRef = useRef<SaveHandler | null>(null)
  const leaveActionRef = useRef<LeaveActionRef | null>(null)
  const leaveProtectionRef = useRef(false)
  const [leaveProtectionEnabled, setLeaveProtectionEnabledState] = useState(false)
  const setLeaveProtectionEnabled = useCallback((enabled: boolean) => {
    leaveProtectionRef.current = enabled
    setLeaveProtectionEnabledState(enabled)
  }, [])
  const isLeaveProtectionActive = useCallback(
    () => leaveProtectionRef.current,
    [],
  )
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false)

  const registerAbandonHandler = useCallback((handler: AbandonHandler | null) => {
    abandonHandlerRef.current = handler
  }, [])

  const registerSaveHandler = useCallback((handler: SaveHandler | null) => {
    saveHandlerRef.current = handler
  }, [])

  const abandonSession = useCallback(async () => {
    if (abandonHandlerRef.current) {
      await abandonHandlerRef.current()
    }
  }, [])

  const saveSessionProgress = useCallback(async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current()
    }
  }, [])

  const openLeaveConfirm = useCallback((action: LeaveActionRef) => {
    leaveActionRef.current = action
    setLeaveConfirmOpen(true)
  }, [])

  const requestLeave = useCallback(
    (action: LeaveAction) => {
      if (!leaveProtectionEnabled) {
        void action()
        return
      }
      openLeaveConfirm({ onConfirm: action })
    },
    [leaveProtectionEnabled, openLeaveConfirm],
  )

  const openLeaveConfirmFromBlocker = useCallback(
    (onConfirm: LeaveAction, onCancel: () => void) => {
      if (!leaveConfirmOpen) {
        openLeaveConfirm({ onConfirm, onCancel })
      }
    },
    [leaveConfirmOpen, openLeaveConfirm],
  )

  const cancelLeave = useCallback(() => {
    leaveActionRef.current?.onCancel?.()
    leaveActionRef.current = null
    setLeaveConfirmOpen(false)
  }, [])

  const confirmLeave = useCallback(
    async (mode: 'save' | 'discard') => {
      const pending = leaveActionRef.current
      leaveActionRef.current = null
      setLeaveConfirmOpen(false)
      setIsConfirmingLeave(true)
      setLeaveProtectionEnabled(false)

      try {
        if (mode === 'save') {
          await saveSessionProgress()
        } else {
          await abandonSession()
        }
        await pending?.onConfirm?.()
      } finally {
        setIsConfirmingLeave(false)
      }
    },
    [abandonSession, saveSessionProgress],
  )

  const value = useMemo(
    () => ({
      attemptId,
      leaveProtectionEnabled,
      isLeaveProtectionActive,
      setLeaveProtectionEnabled,
      registerAbandonHandler,
      registerSaveHandler,
      abandonSession,
      saveSessionProgress,
      requestLeave,
      openLeaveConfirmFromBlocker,
    }),
    [
      attemptId,
      leaveProtectionEnabled,
      isLeaveProtectionActive,
      setLeaveProtectionEnabled,
      registerAbandonHandler,
      registerSaveHandler,
      abandonSession,
      saveSessionProgress,
      requestLeave,
      openLeaveConfirmFromBlocker,
    ],
  )

  return (
    <PracticeAttemptContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {leaveConfirmOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isConfirmingLeave && cancelLeave()}
          >
            <motion.div
              className="glass glow-blue w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-interview-title"
            >
              <h2 id="leave-interview-title" className="text-lg font-semibold text-text-primary">
                Leave this question?
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                You can save your code and progress to resume later, or leave without saving and
                end this session.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void confirmLeave('save')}
                  disabled={isConfirmingLeave}
                  className="w-full rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirmingLeave ? 'Saving…' : 'Save progress & leave'}
                </button>
                <button
                  type="button"
                  onClick={() => void confirmLeave('discard')}
                  disabled={isConfirmingLeave}
                  className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirmingLeave ? 'Leaving…' : 'Leave without saving'}
                </button>
                <button
                  type="button"
                  onClick={cancelLeave}
                  disabled={isConfirmingLeave}
                  className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PracticeAttemptContext.Provider>
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

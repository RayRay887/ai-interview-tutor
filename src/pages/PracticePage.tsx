import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MicrophoneSetupModal } from '../components/practice/MicrophoneSetupModal'
import { PracticeSession } from '../components/practice/PracticeSession'
import { SessionSetupModal } from '../components/practice/SessionSetupModal'
import { PracticeAttemptProvider } from '../context/PracticeAttemptContext'
import { PracticeLeaveGuard } from '../components/practice/PracticeLeaveGuard'
import { useAuth } from '../context/AuthContext'
import { useSignInModal } from '../context/SignInModalContext'
import { getQuestionBySlug } from '../data/questions'
import { stopAllInterviewAudio } from '../hooks/useInterviewerTTS'
import {
  getInProgressAttemptForQuestion,
  getPracticeAttempt,
  startPracticeAttempt,
  type PracticeAttemptRow,
} from '../lib/practiceAttempts'
import {
  getStoredMicDeviceId,
  isDraftRecent,
  readAttemptLocalState,
  consumeRestartRequested,
  readQuestionDraft,
  setStoredMicDeviceId,
  writeAttemptLocalState,
  writeQuestionDraft,
} from '../lib/practiceSessionStorage'
import { isSupabaseConfigured } from '../lib/supabase'
import type { SessionConfig } from '../types/session'

type BootstrapPhase = 'loading' | 'setup' | 'mic' | 'starting' | 'ready'

function applyMicPhase(
  userId: string,
  setMicDeviceId: (id: string) => void,
  setPhase: (phase: BootstrapPhase) => void,
  needsAttempt: boolean,
) {
  const storedMic = getStoredMicDeviceId(userId)
  if (storedMic) {
    setMicDeviceId(storedMic)
    setPhase(needsAttempt ? 'starting' : 'ready')
  } else {
    setPhase('mic')
  }
}

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const question = slug ? getQuestionBySlug(slug) : undefined

  const [phase, setPhase] = useState<BootstrapPhase>('loading')
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [micDeviceId, setMicDeviceId] = useState('')
  const [authPrompted, setAuthPrompted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [restoredAttempt, setRestoredAttempt] = useState<PracticeAttemptRow | null>(null)
  const [attemptStartError, setAttemptStartError] = useState<string | null>(null)

  useEffect(() => {
    return () => stopAllInterviewAudio()
  }, [])

  useEffect(() => {
    if (isLoading || user || !question || authPrompted) return

    setAuthPrompted(true)
    openSignIn({
      redirectTo: `/practice/${question.slug}`,
      onCancel: () => {
        stopAllInterviewAudio()
        navigate('/questions')
      },
    })
  }, [isLoading, user, question, authPrompted, openSignIn, navigate])

  useEffect(() => {
    if (!user || !question) return

    let cancelled = false
    const slugDraft = readQuestionDraft(user.id, question.slug)

    const resumeFromLocalDraft = async (draftAttemptId: string | null) => {
      if (!slugDraft || !isDraftRecent(slugDraft)) return false

      let validAttemptId = draftAttemptId ?? slugDraft.attemptId
      if (validAttemptId && isSupabaseConfigured()) {
        try {
          const row = await getPracticeAttempt(validAttemptId, user.id)
          if (!row || row.status !== 'in_progress') {
            validAttemptId = null
            setRestoredAttempt(null)
          } else {
            setRestoredAttempt(row)
          }
        } catch {
          validAttemptId = null
          setRestoredAttempt(null)
        }
      } else {
        setRestoredAttempt(null)
      }

      setSessionConfig({
        sessionMinutes: slugDraft.sessionMinutes,
        userTestMode: slugDraft.userTestMode,
      })
      setAttemptId(validAttemptId)
      applyMicPhase(user.id, setMicDeviceId, setPhase, !validAttemptId)
      return true
    }

    void (async () => {
      if (consumeRestartRequested(user.id, question.slug)) {
        if (!cancelled) {
          setRestoredAttempt(null)
          setAttemptId(null)
          setPhase('setup')
        }
        return
      }

      if (!isSupabaseConfigured()) {
        if (!cancelled && !(await resumeFromLocalDraft(null))) {
          setPhase('setup')
        }
        return
      }

      try {
        const existing = await getInProgressAttemptForQuestion(user.id, question.slug)
        if (cancelled) return

        if (existing) {
          const local = readAttemptLocalState(existing.id)
          setRestoredAttempt(existing)
          setAttemptId(existing.id)
          setSessionConfig({
            sessionMinutes: existing.session_minutes_planned,
            userTestMode: local?.userTestMode ?? slugDraft?.userTestMode ?? false,
          })
          applyMicPhase(user.id, setMicDeviceId, setPhase, false)
          return
        }

        if (await resumeFromLocalDraft(slugDraft?.attemptId ?? null)) {
          return
        }

        setRestoredAttempt(null)
        setAttemptId(null)
        setPhase('setup')
      } catch {
        if (cancelled) return
        if (await resumeFromLocalDraft(slugDraft?.attemptId ?? null)) {
          return
        }
        setPhase('setup')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, question])

  useEffect(() => {
    if (phase !== 'starting' || !user || !question || !sessionConfig || attemptId) return

    if (!isSupabaseConfigured()) {
      setAttemptStartError('Database is not configured. Add Supabase credentials to .env.')
      return
    }

    let cancelled = false
    setAttemptStartError(null)

    void startPracticeAttempt(user.id, question, sessionConfig.sessionMinutes)
      .then((id) => {
        if (cancelled) return
        writeAttemptLocalState(id, {
          userTestMode: sessionConfig.userTestMode,
          customTestCases: [],
          codeByLanguage: {},
        })
        const draft = readQuestionDraft(user.id, question.slug)
        writeQuestionDraft(user.id, {
          attemptId: id,
          questionSlug: question.slug,
          sessionMinutes: sessionConfig.sessionMinutes,
          userTestMode: sessionConfig.userTestMode,
          language: draft?.language ?? 'python',
          codeByLanguage: {},
          remainingSeconds: sessionConfig.sessionMinutes * 60,
          customTestCases: [],
          updatedAt: Date.now(),
        })
        setAttemptId(id)
        setPhase('ready')
      })
      .catch((err) => {
        if (!cancelled) {
          setAttemptStartError(
            err instanceof Error ? err.message : 'Could not start practice session.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [phase, user, question, sessionConfig, attemptId])

  const handleRestartFromSession = useCallback(() => {
    stopAllInterviewAudio()
    setRestoredAttempt(null)
    setAttemptId(null)
    setPhase('setup')
  }, [])

  const handleSessionConfirm = useCallback((config: SessionConfig) => {
    setSessionConfig(config)
    setRestoredAttempt(null)
    setAttemptId(null)
    setPhase('mic')
  }, [])

  const handleMicConfirm = useCallback(
    (deviceId: string) => {
      if (user) setStoredMicDeviceId(user.id, deviceId)
      setMicDeviceId(deviceId)

      if (attemptId) {
        setPhase('ready')
        return
      }

      setPhase('starting')
    },
    [user, attemptId],
  )

  if (!question) {
    return <Navigate to="/questions" replace />
  }

  if (isLoading || phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-text-secondary">Sign in to start practicing</p>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <SessionSetupModal
        question={question}
        onConfirm={handleSessionConfirm}
        onCancel={() => {
          stopAllInterviewAudio()
          navigate('/questions')
        }}
      />
    )
  }

  if (phase === 'mic') {
    return <MicrophoneSetupModal onConfirm={handleMicConfirm} />
  }

  if (attemptStartError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-rose-300">{attemptStartError}</p>
        <button
          type="button"
          onClick={() => navigate('/questions')}
          className="text-sm text-accent-blue hover:underline"
        >
          Back to questions
        </button>
      </div>
    )
  }

  if (phase !== 'ready' || !sessionConfig || !attemptId || !micDeviceId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    )
  }

  return (
    <PracticeAttemptProvider attemptId={attemptId}>
      <PracticeLeaveGuard />
      <PracticeSession
        key={attemptId}
        attemptId={attemptId}
        question={question}
        microphoneDeviceId={micDeviceId}
        sessionMinutes={sessionConfig.sessionMinutes}
        userTestMode={sessionConfig.userTestMode}
        restoredAttempt={restoredAttempt}
        onRestart={handleRestartFromSession}
      />
    </PracticeAttemptProvider>
  )
}

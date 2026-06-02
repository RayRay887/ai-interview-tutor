import { useEffect, useState } from 'react'
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
import { isSupabaseConfigured } from '../lib/supabase'
import { startPracticeAttempt } from '../lib/practiceAttempts'
import type { SessionConfig } from '../types/session'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const question = slug ? getQuestionBySlug(slug) : undefined
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null)
  const [micReady, setMicReady] = useState(false)
  const [micDeviceId, setMicDeviceId] = useState('')
  const [authPrompted, setAuthPrompted] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptStartError, setAttemptStartError] = useState<string | null>(null)
  const [isStartingAttempt, setIsStartingAttempt] = useState(false)

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
    if (!micReady || !user || !question || !sessionConfig || attemptId) {
      return
    }

    if (!isSupabaseConfigured()) {
      setAttemptStartError('Database is not configured. Add Supabase credentials to .env.')
      return
    }

    let cancelled = false
    setIsStartingAttempt(true)
    setAttemptStartError(null)

    void startPracticeAttempt(user.id, question, sessionConfig.sessionMinutes)
      .then((id) => {
        if (!cancelled) setAttemptId(id)
      })
      .catch((err) => {
        if (!cancelled) {
          setAttemptStartError(
            err instanceof Error ? err.message : 'Could not start practice session.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsStartingAttempt(false)
      })

    return () => {
      cancelled = true
    }
    // Do not include isStartingAttempt — toggling it re-runs this effect and
    // cancels the in-flight insert before attemptId is set (infinite spinner).
  }, [micReady, user, question, sessionConfig, attemptId])

  if (!question) {
    return <Navigate to="/questions" replace />
  }

  if (isLoading) {
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

  if (sessionConfig === null) {
    return (
      <SessionSetupModal
        question={question}
        onConfirm={setSessionConfig}
        onCancel={() => {
          stopAllInterviewAudio()
          navigate('/questions')
        }}
      />
    )
  }

  if (!micReady) {
    return (
      <MicrophoneSetupModal
        onConfirm={(deviceId) => {
          setMicDeviceId(deviceId)
          setMicReady(true)
        }}
      />
    )
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

  if (!attemptId || isStartingAttempt) {
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
        attemptId={attemptId}
        question={question}
        microphoneDeviceId={micDeviceId}
        sessionMinutes={sessionConfig.sessionMinutes}
        userTestMode={sessionConfig.userTestMode}
      />
    </PracticeAttemptProvider>
  )
}

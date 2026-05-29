import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MicrophoneSetupModal } from '../components/practice/MicrophoneSetupModal'
import { PracticeSession } from '../components/practice/PracticeSession'
import { SessionSetupModal } from '../components/practice/SessionSetupModal'
import { useAuth } from '../context/AuthContext'
import { useSignInModal } from '../context/SignInModalContext'
import { getQuestionBySlug } from '../data/questions'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const question = slug ? getQuestionBySlug(slug) : undefined
  const [sessionMinutes, setSessionMinutes] = useState<number | null>(null)
  const [micReady, setMicReady] = useState(false)
  const [micDeviceId, setMicDeviceId] = useState('')
  const [authPrompted, setAuthPrompted] = useState(false)

  useEffect(() => {
    if (isLoading || user || !question || authPrompted) return

    setAuthPrompted(true)
    openSignIn({
      redirectTo: `/practice/${question.slug}`,
      onCancel: () => navigate('/questions'),
    })
  }, [isLoading, user, question, authPrompted, openSignIn, navigate])

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

  if (sessionMinutes === null) {
    return (
      <SessionSetupModal
        question={question}
        onConfirm={setSessionMinutes}
        onCancel={() => navigate('/questions')}
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

  return (
    <PracticeSession
      question={question}
      microphoneDeviceId={micDeviceId}
      sessionMinutes={sessionMinutes}
    />
  )
}

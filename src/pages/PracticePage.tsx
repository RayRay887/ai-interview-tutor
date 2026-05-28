import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { MicrophoneSetupModal } from '../components/practice/MicrophoneSetupModal'
import { PracticeSession } from '../components/practice/PracticeSession'
import { useAuth } from '../context/AuthContext'
import { useSignInModal } from '../context/SignInModalContext'
import { getQuestionBySlug } from '../data/questions'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const question = slug ? getQuestionBySlug(slug) : undefined
  const [micReady, setMicReady] = useState(false)
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

  if (!micReady) {
    return <MicrophoneSetupModal onConfirm={() => setMicReady(true)} />
  }

  return <PracticeSession question={question} />
}

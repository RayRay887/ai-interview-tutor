import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { MicrophoneSetupModal } from '../components/practice/MicrophoneSetupModal'
import { PracticeSession } from '../components/practice/PracticeSession'
import { getQuestionBySlug } from '../data/questions'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const question = slug ? getQuestionBySlug(slug) : undefined
  const [micReady, setMicReady] = useState(false)

  if (!question) {
    return <Navigate to="/questions" replace />
  }

  if (!micReady) {
    return <MicrophoneSetupModal onConfirm={() => setMicReady(true)} />
  }

  return <PracticeSession question={question} />
}

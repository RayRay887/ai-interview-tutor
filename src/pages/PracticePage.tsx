import { Navigate, useParams } from 'react-router-dom'
import { PracticeSession } from '../components/practice/PracticeSession'
import { getQuestionBySlug } from '../data/questions'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const question = slug ? getQuestionBySlug(slug) : undefined

  if (!question) {
    return <Navigate to="/questions" replace />
  }

  return <PracticeSession question={question} />
}

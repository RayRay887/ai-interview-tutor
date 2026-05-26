import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PracticeSession } from '../components/practice/PracticeSession'
import { getQuestionBySlug } from '../data/questions'

export function PracticePage() {
  const { slug } = useParams<{ slug: string }>()
  const question = slug ? getQuestionBySlug(slug) : undefined

  if (!question) {
    return <Navigate to="/questions" replace />
  }

  return (
    <main className="relative pt-24 pb-16 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/questions"
            className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent-blue"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to questions
          </Link>
        </motion.div>

        <PracticeSession question={question} />
      </div>
    </main>
  )
}

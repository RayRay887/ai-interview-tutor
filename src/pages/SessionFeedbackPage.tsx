import { motion } from 'framer-motion'
import {
  AlertCircle,
  Code2,
  Loader2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  FeedbackSectionCard,
  OptimizationExtras,
} from '../components/feedback/FeedbackSectionCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { useAuth } from '../context/AuthContext'
import { getQuestionBySlug } from '../data/questions'
import { requestInterviewFeedback } from '../lib/feedbackApi'
import {
  buildFeedbackRequestFromAttempt,
  buildFinalizeSnapshotFromAttempt,
  finalizePracticeAttempt,
  getPracticeAttempt,
  saveAttemptFeedback,
} from '../lib/practiceAttempts'
import { isSupabaseConfigured } from '../lib/supabase'
import { scrollToTop } from '../lib/scrollToTop'
import {
  RECOMMENDATION_LABELS,
  type FeedbackRecommendation,
} from '../prompts/interviewer/feedbackRubric'
import type { InterviewFeedbackResult } from '../types/feedback'

const recommendationStyles: Record<FeedbackRecommendation, string> = {
  strong_hire: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hire: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  lean_hire: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  lean_no_hire: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  no_hire: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export function SessionFeedbackPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { user, isLoading: authLoading } = useAuth()

  const [feedback, setFeedback] = useState<InterviewFeedbackResult | null>(null)
  const [questionSlug, setQuestionSlug] = useState<string | null>(null)
  const [questionTitle, setQuestionTitle] = useState('')
  const [questionDifficulty, setQuestionDifficulty] = useState<
    'Easy' | 'Medium' | 'Hard'
  >('Medium')
  const [questionCategory, setQuestionCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = useCallback(
    async (attemptIdValue: string, userId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        let attempt = await getPracticeAttempt(attemptIdValue, userId)
        if (!attempt) {
          setError('Session not found.')
          return
        }

        if (attempt.status === 'abandoned') {
          const promoted = await finalizePracticeAttempt(
            attemptIdValue,
            userId,
            'completed',
            buildFinalizeSnapshotFromAttempt(attempt),
          )
          if (promoted.status !== 'completed') {
            setError(
              'This session was not saved as submitted. Start a new practice session and use Submit when you finish.',
            )
            return
          }
          attempt = { ...promoted, attempt_feedback: attempt.attempt_feedback }
        }

        if (attempt.status !== 'completed') {
          setError('Feedback is only available for submitted sessions.')
          return
        }

        setQuestionSlug(attempt.question_slug)
        setQuestionTitle(attempt.question_title)
        setQuestionDifficulty(attempt.difficulty)
        setQuestionCategory(attempt.category)

        if (attempt.attempt_feedback) {
          setFeedback(attempt.attempt_feedback.feedback)
          return
        }

        const catalog = getQuestionBySlug(attempt.question_slug)
        const request = buildFeedbackRequestFromAttempt(
          attempt,
          catalog?.description ?? attempt.question_title,
          catalog?.constraints,
        )

        const result = await requestInterviewFeedback(request)
        setFeedback(result)
        await saveAttemptFeedback(attemptIdValue, userId, result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not generate interview feedback.')
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    scrollToTop()
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!attemptId) {
      setError('Invalid session link.')
      setIsLoading(false)
      return
    }

    if (!user) {
      setError('Sign in to view feedback.')
      setIsLoading(false)
      return
    }

    if (!isSupabaseConfigured()) {
      setError('Database is not configured.')
      setIsLoading(false)
      return
    }

    void fetchFeedback(attemptId, user.id)
  }, [attemptId, user, authLoading, fetchFeedback])

  if (!attemptId) {
    return (
      <main className="relative pt-28 pb-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-text-secondary">Invalid session.</p>
          <Button to="/dashboard" variant="primary" className="mt-4">
            Dashboard
          </Button>
        </div>
      </main>
    )
  }

  const styles = feedback ? recommendationStyles[feedback.recommendation] : null

  return (
    <main className="relative pt-28 pb-20 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-2 text-sm font-medium tracking-widest text-accent-blue uppercase">
            Interview feedback
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            <GradientText as="span">{questionTitle || 'Your session'}</GradientText>
          </h1>
          {questionTitle && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge label={questionDifficulty} variant={questionDifficulty} />
              <span className="text-sm text-text-secondary">{questionCategory}</span>
            </div>
          )}
        </motion.div>

        {isLoading && (
          <div className="glass flex flex-col items-center rounded-2xl border border-white/10 py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent-blue" />
            <p className="mt-4 text-sm font-medium text-text-primary">Analyzing your session…</p>
            <p className="mt-2 max-w-sm text-xs text-text-secondary">
              Grading code, verbal interview, and complexity across FAANG-style rubrics.
            </p>
          </div>
        )}

        {!isLoading && error && !feedback && (
          <div className="glass rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-3 text-sm text-rose-200">{error}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {user && (
                <button
                  type="button"
                  onClick={() => void fetchFeedback(attemptId, user.id)}
                  className="text-sm font-medium text-accent-blue hover:underline"
                >
                  Try again
                </button>
              )}
              <Button to="/dashboard" variant="secondary">
                Dashboard
              </Button>
              {questionSlug && (
                <Button to={`/practice/${questionSlug}`} variant="primary">
                  Practice again
                </Button>
              )}
            </div>
          </div>
        )}

        {!isLoading && feedback && styles && (
          <div className="space-y-6">
            <motion.div
              className="glass flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent-blue text-accent-blue">
                <span className="text-2xl font-bold">{feedback.overallScore}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-80">/ 100</span>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
                >
                  {RECOMMENDATION_LABELS[feedback.recommendation]}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">{feedback.headline}</p>
              </div>
            </motion.div>

            <FeedbackSectionCard
              title="Code rubric"
              subtitle="Submitted solution — correctness, testing, and edge cases"
              icon={<Code2 className="h-5 w-5" />}
              section={feedback.code}
              accentClass="text-accent-blue"
            />

            <FeedbackSectionCard
              title="Verbal interview"
              subtitle="Spoken explanation — approach, logic clarity, and communication"
              icon={<MessageSquare className="h-5 w-5" />}
              section={feedback.interview}
              accentClass="text-accent-purple"
            />

            <FeedbackSectionCard
              title="Complexity & optimization"
              subtitle="Time/space analysis and whether the solution is optimal"
              icon={<TrendingUp className="h-5 w-5" />}
              section={feedback.optimization}
              accentClass="text-emerald-400"
              extra={<OptimizationExtras section={feedback.optimization} />}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button to="/dashboard" variant="secondary">
                View dashboard
              </Button>
              {questionSlug && (
                <Button to={`/practice/${questionSlug}`} variant="ghost">
                  Practice again
                </Button>
              )}
              <Button to="/questions" variant="primary">
                Browse questions
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

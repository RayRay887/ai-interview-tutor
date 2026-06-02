import { motion } from 'framer-motion'
import {
  AlertCircle,
  Code2,
  Loader2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  FeedbackSectionCard,
  OptimizationExtras,
} from '../components/feedback/FeedbackSectionCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { useAuth } from '../context/AuthContext'
import { getQuestionBySlug } from '../data/questions'
import {
  clearFeedbackRequestCache,
  getCachedFeedbackResult,
  requestInterviewFeedbackOnce,
} from '../lib/feedbackApi'
import { getLatestFeedbackForQuestion, saveFeedbackHistory } from '../lib/feedbackHistory'
import { scrollToTop } from '../lib/scrollToTop'
import {
  RECOMMENDATION_LABELS,
  type FeedbackRecommendation,
} from '../prompts/interviewer/feedbackRubric'
import type {
  FeedbackNavigationState,
  FeedbackViewState,
  InterviewFeedbackResult,
} from '../types/feedback'

const recommendationStyles: Record<FeedbackRecommendation, string> = {
  strong_hire: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hire: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  lean_hire: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  lean_no_hire: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  no_hire: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export function SessionFeedbackPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const { user } = useAuth()

  const navState = location.state as FeedbackNavigationState | FeedbackViewState | null
  const feedbackRequestId =
    navState && 'feedbackRequestId' in navState ? navState.feedbackRequestId : undefined
  const pendingRequest =
    navState && 'request' in navState ? navState.request : undefined

  const [feedback, setFeedback] = useState<InterviewFeedbackResult | null>(() => {
    if (navState && 'feedback' in navState) return navState.feedback
    if (feedbackRequestId) return getCachedFeedbackResult(feedbackRequestId) ?? null
    return null
  })
  const [questionMeta, setQuestionMeta] = useState(
    navState?.question ??
      (slug && getQuestionBySlug(slug)
        ? {
            slug,
            title: getQuestionBySlug(slug)!.title,
            difficulty: getQuestionBySlug(slug)!.difficulty,
            category: getQuestionBySlug(slug)!.category,
          }
        : null),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scrollToTop()
  }, [])

  useEffect(() => {
    if (feedback) return

    if (pendingRequest && feedbackRequestId) {
      const cached = getCachedFeedbackResult(feedbackRequestId)
      if (cached) {
        setFeedback(cached)
        return
      }

      let cancelled = false
      setIsLoading(true)
      setError(null)

      void requestInterviewFeedbackOnce(feedbackRequestId, pendingRequest)
        .then((result) => {
          if (cancelled) return
          setFeedback(result)
          if (user && questionMeta) {
            saveFeedbackHistory(user.id, questionMeta, result)
          }
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : 'Could not generate interview feedback.')
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })

      return () => {
        cancelled = true
      }
    }

    if (user && slug) {
      const cached = getLatestFeedbackForQuestion(user.id, slug)
      if (cached) {
        setFeedback(cached.feedback)
        setQuestionMeta({
          slug: cached.slug,
          title: cached.title,
          difficulty: cached.difficulty,
          category: cached.category,
        })
        return
      }
    }

    if (!pendingRequest) {
      setError('No feedback data for this session. Submit from a practice session to generate a report.')
    }
  }, [feedback, pendingRequest, feedbackRequestId, user, slug, questionMeta])

  if (!slug || !questionMeta) {
    return (
      <main className="relative pt-28 pb-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-text-secondary">Question not found.</p>
          <Button to="/questions" variant="primary" className="mt-4">
            Back to questions
          </Button>
        </div>
      </main>
    )
  }

  const styles = feedback ? recommendationStyles[feedback.recommendation] : null

  const handleRetry = () => {
    if (!pendingRequest || !feedbackRequestId) return
    clearFeedbackRequestCache(feedbackRequestId)
    setFeedback(null)
    setError(null)
    setIsLoading(true)
    void requestInterviewFeedbackOnce(feedbackRequestId, pendingRequest)
      .then((result) => {
        setFeedback(result)
        if (user && questionMeta) {
          saveFeedbackHistory(user.id, questionMeta, result)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not generate interview feedback.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

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
            <GradientText as="span">{questionMeta.title}</GradientText>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge label={questionMeta.difficulty} variant={questionMeta.difficulty} />
            <span className="text-sm text-text-secondary">{questionMeta.category}</span>
          </div>
        </motion.div>

        {isLoading && (
          <div className="glass flex flex-col items-center rounded-2xl border border-white/10 py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent-blue" />
            <p className="mt-4 text-sm font-medium text-text-primary">Analyzing your session…</p>
            <p className="mt-2 max-w-sm text-xs text-text-secondary">
              Grading against Tech Interview Handbook and Golden Rubric dimensions.
            </p>
          </div>
        )}

        {!isLoading && error && !feedback && (
          <div className="glass rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-3 text-sm text-rose-200">{error}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {pendingRequest && feedbackRequestId && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-sm font-medium text-accent-blue hover:underline"
                >
                  Try again
                </button>
              )}
              <Button to={`/practice/${slug}`} variant="secondary">
                Return to session
              </Button>
              <Button to="/questions" variant="primary">
                Browse questions
              </Button>
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
              subtitle="Technical competency, coding & syntax, testing — Tech Interview Handbook + Golden Rubric"
              icon={<Code2 className="h-5 w-5" />}
              section={feedback.code}
              accentClass="text-accent-blue"
            />

            <FeedbackSectionCard
              title="Verbal interview"
              subtitle="Communication, problem solving, ambiguity, feedback — how you explained your approach"
              icon={<MessageSquare className="h-5 w-5" />}
              section={feedback.interview}
              accentClass="text-accent-purple"
            />

            <FeedbackSectionCard
              title="Complexity & optimization"
              subtitle="Data structures, algorithms, Big-O, and runtime vs space tradeoffs"
              icon={<TrendingUp className="h-5 w-5" />}
              section={feedback.optimization}
              accentClass="text-emerald-400"
              extra={<OptimizationExtras section={feedback.optimization} />}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button to="/dashboard" variant="secondary">
                View dashboard
              </Button>
              <Button to={`/practice/${slug}`} variant="ghost">
                Practice again
              </Button>
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

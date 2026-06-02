import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, Mail, Mic, User, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { useAuth } from '../context/AuthContext'
import { useSignInModal } from '../context/SignInModalContext'
import { practiceQuestionCount } from '../data/questions'
import {
  formatElapsedOverPlanned,
  formatHistoryDate,
  formatTotalPracticeTime,
  groupCompletedAttemptsByQuestion,
  listAbandonedAttempts,
  getTotalPracticeSeconds,
  listPracticeAttempts,
  type PracticeAttemptRow,
  type QuestionAttemptGroup,
} from '../lib/practiceAttempts'
import { RECOMMENDATION_LABELS } from '../prompts/interviewer/feedbackRubric'
import { isSupabaseConfigured } from '../lib/supabase'
import { scrollToTop } from '../lib/scrollToTop'

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const [authPrompted, setAuthPrompted] = useState(false)
  const [completedGroups, setCompletedGroups] = useState<QuestionAttemptGroup[]>([])
  const [abandoned, setAbandoned] = useState<PracticeAttemptRow[]>([])
  const [totalPracticeSeconds, setTotalPracticeSeconds] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setHistoryLoading(false)
      if (!isSupabaseConfigured()) {
        setHistoryError('Database is not configured.')
      }
      return
    }

    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const attempts = await listPracticeAttempts(user.id)
      setCompletedGroups(groupCompletedAttemptsByQuestion(attempts))
      setAbandoned(listAbandonedAttempts(attempts))

      const total = await getTotalPracticeSeconds(user.id)
      setTotalPracticeSeconds(total)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Could not load history.')
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  useEffect(() => {
    scrollToTop()
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (isLoading || user || authPrompted) return

    setAuthPrompted(true)
    openSignIn({
      redirectTo: '/dashboard',
      onCancel: () => navigate('/'),
    })
  }, [isLoading, user, authPrompted, openSignIn, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28">
        <p className="text-sm text-text-secondary">Sign in to view your dashboard</p>
      </div>
    )
  }

  const firstName = user.name.split(' ')[0]
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <main className="relative pt-28 pb-20 sm:pt-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-3 text-sm font-medium tracking-widest text-accent-blue uppercase">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome, <GradientText as="span">{firstName}</GradientText>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Track completed sessions, incomplete interviews, and your total practice time.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <motion.section
            className="glass rounded-2xl border border-white/10 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple text-lg font-semibold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-text-primary">{user.name}</p>
                <p className="mt-1 flex items-center gap-2 truncate text-sm text-text-secondary">
                  <Mail className="h-4 w-4 shrink-0 text-accent-blue" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <User className="h-4 w-4" />
                  Account
                </span>
                <span className="text-text-primary">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <BookOpen className="h-4 w-4" />
                  Question bank
                </span>
                <span className="text-text-primary">{practiceQuestionCount} problems</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-text-secondary">
                  <Clock className="h-4 w-4" />
                  Total practice time
                </span>
                <span className="text-text-primary">
                  {formatTotalPracticeTime(totalPracticeSeconds)}
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="glass rounded-2xl border border-white/10 p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
              <Mic className="h-5 w-5" />
            </div>
            <h2 className="text-base font-medium text-text-primary">Start practicing</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Pick a problem and run a timed session with the AI voice interviewer.
            </p>
            <Button to="/questions" variant="primary" className="mt-4 w-full">
              Browse questions
            </Button>
          </motion.section>
        </div>

        {historyError && (
          <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {historyError}
          </p>
        )}

        {historyLoading ? (
          <div className="mt-8 flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
          </div>
        ) : (
          <>
            <motion.section
              className="glass mt-8 rounded-2xl border border-white/10 p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-text-primary">Completed sessions</h2>
                  <p className="text-xs text-text-secondary">
                    Submitted interviews with feedback
                  </p>
                </div>
              </div>

              {completedGroups.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
                  No completed sessions yet. Submit a practice session to see feedback here.
                </p>
              ) : (
                <div className="space-y-6">
                  {completedGroups.map((group) => (
                    <div key={group.questionSlug}>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text-primary">{group.questionTitle}</p>
                        <Badge label={group.difficulty} variant={group.difficulty} />
                        <span className="text-xs text-text-secondary">{group.category}</span>
                        <span className="text-xs text-text-secondary/70">
                          · {group.attempts.length} attempt
                          {group.attempts.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {group.attempts.map((attempt, index) => {
                          const attemptNumber = group.attempts.length - index
                          const fb = attempt.attempt_feedback
                          const endedLabel = formatHistoryDate(
                            attempt.ended_at ?? attempt.started_at,
                          )
                          const elapsed = formatElapsedOverPlanned(
                            attempt.duration_seconds,
                            attempt.session_minutes_planned,
                          )

                          return (
                            <li key={attempt.id}>
                              <Link
                                to={`/feedback/attempt/${attempt.id}`}
                                className="block rounded-xl border border-white/10 bg-bg-primary/40 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-medium text-text-secondary">
                                      Attempt {attemptNumber} · {endedLabel}
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                      {elapsed} elapsed
                                      {attempt.all_tests_passed && (
                                        <span className="ml-2 text-emerald-400/90">
                                          · All tests passed
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {fb && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-text-primary">
                                        {fb.overall_score}/100
                                      </span>
                                      <Badge
                                        label={RECOMMENDATION_LABELS[fb.recommendation]}
                                      />
                                    </div>
                                  )}
                                </div>
                                {fb && (
                                  <p className="mt-2 text-sm text-text-secondary">{fb.headline}</p>
                                )}
                                <p className="mt-2 text-xs font-medium text-accent-blue">
                                  View feedback →
                                </p>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section
              className="glass mt-6 rounded-2xl border border-white/10 p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                  <XCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-text-primary">
                    Incomplete interviews
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Sessions ended before submit — time still counts toward your total
                  </p>
                </div>
              </div>

              {abandoned.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
                  No incomplete sessions. Leaving early without submitting will appear here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {abandoned.map((attempt) => {
                    const endedLabel = formatHistoryDate(attempt.ended_at ?? attempt.started_at)
                    const elapsed = formatElapsedOverPlanned(
                      attempt.duration_seconds,
                      attempt.session_minutes_planned,
                    )

                    return (
                      <li key={attempt.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-bg-primary/40 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {attempt.question_title}
                            </p>
                            <p className="mt-1 text-xs text-text-secondary">
                              {endedLabel} · Cut short after {elapsed}
                            </p>
                          </div>
                          <Link
                            to={`/practice/${attempt.question_slug}`}
                            className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-white/5"
                          >
                            Try again
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </motion.section>
          </>
        )}
      </div>
    </main>
  )
}

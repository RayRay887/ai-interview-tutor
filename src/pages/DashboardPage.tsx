import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mail,
  Mic,
  User,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
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

const COMPLETED_GROUPS_PREVIEW = 3
const COMPLETED_ATTEMPTS_PREVIEW = 2
const INCOMPLETE_PREVIEW = 4

const historyToggleClassName =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-accent-blue transition-colors hover:border-white/20 hover:bg-white/10'

function ShowLessButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${historyToggleClassName} ${className}`.trim()}
      aria-label="Show less"
    >
      <span>Show less</span>
      <ChevronDown className="h-4 w-4 shrink-0 rotate-180" />
    </button>
  )
}

function ViewFullToggle({
  expanded,
  onToggle,
  onShowLess,
  canToggle,
  collapsedLabel,
}: {
  expanded: boolean
  onToggle: () => void
  onShowLess: () => void
  /** When true, list exceeds preview limits — show View all / Show less. */
  canToggle: boolean
  collapsedLabel: string
}) {
  if (!canToggle) return null

  if (expanded) {
    return (
      <button
        type="button"
        onClick={onShowLess}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-white/20 hover:bg-white/10"
        aria-expanded
      >
        <span>Show less</span>
        <ChevronDown className="h-4 w-4 shrink-0 rotate-180" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-accent-blue transition-colors hover:border-white/20 hover:bg-white/10"
      aria-expanded={false}
    >
      <span>{collapsedLabel}</span>
      <ChevronDown className="h-4 w-4 shrink-0" />
    </button>
  )
}

function SectionHeader({
  icon,
  iconClassName,
  title,
  subtitle,
  count,
  trailingAction,
}: {
  icon: ReactNode
  iconClassName: string
  title: string
  subtitle: string
  count?: number
  trailingAction?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium text-text-primary">{title}</h2>
          {count != null && count > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-text-secondary">
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
      {trailingAction ? <div className="shrink-0">{trailingAction}</div> : null}
    </div>
  )
}

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
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [incompleteExpanded, setIncompleteExpanded] = useState(false)

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

  const totalCompletedAttempts = completedGroups.reduce(
    (sum, group) => sum + group.attempts.length,
    0,
  )
  const completedNeedsExpand =
    completedGroups.length > COMPLETED_GROUPS_PREVIEW ||
    completedGroups.some((group) => group.attempts.length > COMPLETED_ATTEMPTS_PREVIEW)
  const visibleCompletedGroups = completedExpanded
    ? completedGroups
    : completedGroups.slice(0, COMPLETED_GROUPS_PREVIEW)
  const visibleCompletedCount = completedExpanded
    ? totalCompletedAttempts
    : visibleCompletedGroups.reduce(
        (sum, group) =>
          sum +
          Math.min(group.attempts.length, COMPLETED_ATTEMPTS_PREVIEW),
        0,
      )

  const incompleteNeedsExpand = abandoned.length > INCOMPLETE_PREVIEW
  const visibleAbandoned = incompleteExpanded
    ? abandoned
    : abandoned.slice(0, INCOMPLETE_PREVIEW)

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
              <SectionHeader
                icon={<CheckCircle2 className="h-4 w-4" />}
                iconClassName="bg-emerald-500/15 text-emerald-400"
                title="Completed sessions"
                subtitle="Submitted interviews with feedback"
                count={totalCompletedAttempts}
                trailingAction={
                  completedExpanded && completedNeedsExpand ? (
                    <ShowLessButton onClick={() => setCompletedExpanded(false)} />
                  ) : null
                }
              />

              {completedGroups.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
                  No completed sessions yet. Submit a practice session to see feedback here.
                </p>
              ) : (
                <>
                  {completedNeedsExpand && (
                    <p className="mb-4 text-xs text-text-secondary/80">
                      {completedExpanded ? (
                        <>Showing all {totalCompletedAttempts} sessions</>
                      ) : (
                        <>
                          Showing {visibleCompletedCount} of {totalCompletedAttempts} sessions
                          across {Math.min(completedGroups.length, COMPLETED_GROUPS_PREVIEW)} of{' '}
                          {completedGroups.length} questions
                        </>
                      )}
                    </p>
                  )}
                  <div className="space-y-5">
                    {visibleCompletedGroups.map((group) => {
                      const attempts = completedExpanded
                        ? group.attempts
                        : group.attempts.slice(0, COMPLETED_ATTEMPTS_PREVIEW)
                      const hiddenAttempts = group.attempts.length - attempts.length

                      return (
                        <div
                          key={group.questionSlug}
                          className="rounded-xl border border-white/10 bg-bg-primary/30 p-4"
                        >
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
                            {attempts.map((attempt, index) => {
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
                                    className="block rounded-lg border border-white/10 bg-bg-primary/50 p-3 transition-colors hover:border-white/20 hover:bg-white/5"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
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
                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                                      <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                                        {fb.headline}
                                      </p>
                                    )}
                                    <p className="mt-2 text-xs font-medium text-accent-blue">
                                      View feedback →
                                    </p>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                          {!completedExpanded && hiddenAttempts > 0 && (
                            <p className="mt-2 text-xs text-text-secondary/70">
                              +{hiddenAttempts} more attempt{hiddenAttempts === 1 ? '' : 's'} for
                              this question
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <ViewFullToggle
                    expanded={completedExpanded}
                    onToggle={() => setCompletedExpanded(true)}
                    onShowLess={() => setCompletedExpanded(false)}
                    canToggle={completedNeedsExpand}
                    collapsedLabel={`View all completed (${totalCompletedAttempts})`}
                  />
                </>
              )}
            </motion.section>

            <motion.section
              className="glass mt-6 rounded-2xl border border-white/10 p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SectionHeader
                icon={<XCircle className="h-4 w-4" />}
                iconClassName="bg-amber-500/15 text-amber-400"
                title="Incomplete interviews"
                subtitle="Sessions ended before submit — time still counts toward your total"
                count={abandoned.length}
                trailingAction={
                  incompleteExpanded && incompleteNeedsExpand ? (
                    <ShowLessButton onClick={() => setIncompleteExpanded(false)} />
                  ) : null
                }
              />

              {abandoned.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
                  No incomplete sessions. Leaving early without submitting will appear here.
                </p>
              ) : (
                <>
                  {incompleteNeedsExpand && (
                    <p className="mb-4 text-xs text-text-secondary/80">
                      {incompleteExpanded ? (
                        <>Showing all {abandoned.length} incomplete sessions</>
                      ) : (
                        <>
                          Showing {visibleAbandoned.length} of {abandoned.length} incomplete
                          sessions
                        </>
                      )}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {visibleAbandoned.map((attempt) => {
                      const endedLabel = formatHistoryDate(attempt.ended_at ?? attempt.started_at)
                      const elapsed = formatElapsedOverPlanned(
                        attempt.duration_seconds,
                        attempt.session_minutes_planned,
                      )

                      return (
                        <li key={attempt.id}>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-bg-primary/40 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">
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
                  <ViewFullToggle
                    expanded={incompleteExpanded}
                    onToggle={() => setIncompleteExpanded(true)}
                    onShowLess={() => setIncompleteExpanded(false)}
                    canToggle={incompleteNeedsExpand}
                    collapsedLabel={`View all incomplete (${abandoned.length})`}
                  />
                </>
              )}
            </motion.section>
          </>
        )}
      </div>
    </main>
  )
}

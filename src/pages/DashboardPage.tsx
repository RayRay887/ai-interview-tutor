import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, Mail, Mic, Sparkles, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { useAuth } from '../context/AuthContext'
import { useSignInModal } from '../context/SignInModalContext'
import { practiceQuestionCount } from '../data/questions'
import {
  formatHistoryDate,
  getPracticeHistory,
  PRACTICE_HISTORY_UPDATED,
  type PracticeHistoryEntry,
} from '../lib/practiceHistory'
import {
  FEEDBACK_HISTORY_UPDATED,
  getFeedbackHistory,
  type FeedbackHistoryEntry,
} from '../lib/feedbackHistory'
import { RECOMMENDATION_LABELS } from '../prompts/interviewer/feedbackRubric'
import { scrollToTop } from '../lib/scrollToTop'

function HistoryList({
  entries,
  emptyMessage,
}: {
  entries: PracticeHistoryEntry[]
  emptyMessage: string
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.slug}>
          <Link
            to={`/practice/${entry.slug}`}
            className="block rounded-xl border border-white/10 bg-bg-primary/40 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-text-primary">{entry.title}</p>
              <Badge label={entry.difficulty} variant={entry.difficulty} />
            </div>
            <p className="mt-1 text-xs text-accent-blue/80">{entry.category}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="h-3.5 w-3.5" />
              {formatHistoryDate(entry.timestamp)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const [authPrompted, setAuthPrompted] = useState(false)
  const [opened, setOpened] = useState<PracticeHistoryEntry[]>([])
  const [completed, setCompleted] = useState<PracticeHistoryEntry[]>([])
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackHistoryEntry[]>([])

  const loadHistory = useCallback(() => {
    if (!user) return
    const history = getPracticeHistory(user.id)
    setOpened(history.opened)
    setCompleted(history.completed)
    setFeedbackEntries(getFeedbackHistory(user.id))
  }, [user])

  useEffect(() => {
    scrollToTop()
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (!user) return

    const onHistoryUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail
      if (detail?.userId === user.id) {
        loadHistory()
      }
    }

    window.addEventListener(PRACTICE_HISTORY_UPDATED, onHistoryUpdated)
    window.addEventListener(FEEDBACK_HISTORY_UPDATED, onHistoryUpdated)
    return () => {
      window.removeEventListener(PRACTICE_HISTORY_UPDATED, onHistoryUpdated)
      window.removeEventListener(FEEDBACK_HISTORY_UPDATED, onHistoryUpdated)
    }
  }, [user, loadHistory])

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
            Track your account and jump back into AI mock interviews whenever you are ready.
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.section
            className="glass rounded-2xl border border-white/10 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-medium text-text-primary">Questions opened</h2>
                <p className="text-xs text-text-secondary">Problems you started a session on</p>
              </div>
            </div>
            <HistoryList
              entries={opened}
              emptyMessage="No questions opened yet. Start a practice session to see it here."
            />
          </motion.section>

          <motion.section
            className="glass rounded-2xl border border-white/10 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-medium text-text-primary">Questions completed</h2>
                <p className="text-xs text-text-secondary">All visible and hidden tests passed</p>
              </div>
            </div>
            <HistoryList
              entries={completed}
              emptyMessage="No completed questions yet. Pass all tests in a session to mark one complete."
            />
          </motion.section>
        </div>

        <motion.section
          className="glass mt-6 rounded-2xl border border-white/10 p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-text-primary">Interview feedback</h2>
              <p className="text-xs text-text-secondary">
                FAANG-style rubric scores after you submit a session
              </p>
            </div>
          </div>

          {feedbackEntries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-text-secondary/80">
              No feedback yet. Run tests in a session and click Submit for feedback.
            </p>
          ) : (
            <ul className="space-y-3">
              {feedbackEntries.map((entry) => (
                <li key={`${entry.slug}-${entry.timestamp}`}>
                  <Link
                    to={`/feedback/${entry.slug}`}
                    state={{
                      feedback: entry.feedback,
                      question: {
                        slug: entry.slug,
                        title: entry.title,
                        difficulty: entry.difficulty,
                        category: entry.category,
                      },
                    }}
                    className="block rounded-xl border border-white/10 bg-bg-primary/40 p-4 transition-colors hover:border-white/20 hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{entry.title}</p>
                        <p className="mt-1 text-xs text-accent-blue/80">{entry.category}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-text-primary">
                          {entry.overallScore}/100
                        </span>
                        <Badge label={RECOMMENDATION_LABELS[entry.recommendation]} />
                        <Badge label={entry.difficulty} variant={entry.difficulty} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{entry.headline}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                      <Clock className="h-3.5 w-3.5" />
                      {formatHistoryDate(entry.timestamp)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </main>
  )
}

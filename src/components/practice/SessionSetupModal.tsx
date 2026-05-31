import { ArrowRight, Clock, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import type { Question } from '../../data/questions'
import {
  clampSessionMinutes,
  MIN_SESSION_MINUTES,
  parseQuestionDurationMinutes,
} from '../../lib/questionDuration'
import type { SessionConfig } from '../../types/session'

interface SessionSetupModalProps {
  question: Question
  onConfirm: (config: SessionConfig) => void
  onCancel: () => void
}

export function SessionSetupModal({ question, onConfirm, onCancel }: SessionSetupModalProps) {
  const defaultMinutes = parseQuestionDurationMinutes(question.duration)
  const [sessionMinutes, setSessionMinutes] = useState(defaultMinutes)
  const [userTestMode, setUserTestMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    const clamped = clampSessionMinutes(sessionMinutes)
    if (clamped !== sessionMinutes) {
      setError(`Minimum session length is ${MIN_SESSION_MINUTES} minutes.`)
      setSessionMinutes(clamped)
      return
    }
    onConfirm({ sessionMinutes: clamped, userTestMode })
  }

  const handleMinutesChange = (rawValue: string) => {
    setError(null)
    const parsed = Number.parseInt(rawValue, 10)
    if (!Number.isFinite(parsed)) return
    setSessionMinutes(parsed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm">
      <div className="glass glow-blue w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/15">
            <Clock className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Session setup</h2>
            <p className="text-sm text-text-secondary">
              Configure your session for{' '}
              <span className="text-text-primary">{question.title}</span>.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
            <p className="text-xs font-medium tracking-wider text-text-secondary uppercase">
              Recommended
            </p>
            <p className="mt-1 text-sm text-text-primary">{question.duration}</p>
          </div>

          <div>
            <label htmlFor="session-minutes" className="mb-2 block text-xs font-medium text-text-secondary">
              Session time (minutes)
            </label>
            <input
              id="session-minutes"
              type="number"
              min={MIN_SESSION_MINUTES}
              step={5}
              value={sessionMinutes}
              onChange={(event) => handleMinutesChange(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-blue/40"
            />
            <p className="mt-2 text-xs text-text-secondary">
              Minimum {MIN_SESSION_MINUTES} minutes. This cannot be changed once the session starts.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent-purple" />
              <div className="flex-1">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={userTestMode}
                    onChange={(event) => setUserTestMode(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-bg-primary accent-accent-blue"
                  />
                  <span>
                    <span className="block text-sm font-medium text-text-primary">
                      User test mode
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                      {userTestMode
                        ? 'Only the example cases are provided — you design and add your own tests.'
                        : 'Example cases plus hidden edge-case validation after examples pass.'}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          >
            Back to questions
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90"
          >
            Start practicing
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

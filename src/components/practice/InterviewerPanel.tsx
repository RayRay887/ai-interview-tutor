import { Bot, Loader2, Mic, Play, Volume2 } from 'lucide-react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewerPanelProps {
  phase: InterviewPhase
  error: string | null
  isSpeaking: boolean
  paused?: boolean
  isListening?: boolean
  speechSupported?: boolean
  showPlayButton?: boolean
  onRetry?: () => void
  onPlayIntroduction?: () => void
  onSubmit?: () => void
  submitDisabled?: boolean
}

function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i)

  return (
    <div className="flex h-16 items-end justify-center gap-1 px-2">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1.5 rounded-full bg-accent-blue transition-all duration-300 ${
            active ? 'animate-pulse' : 'opacity-30'
          }`}
          style={{ height: active ? 12 + (bar % 6) * 8 : 8 }}
        />
      ))}
    </div>
  )
}

function statusLabel(
  phase: InterviewPhase,
  isSpeaking: boolean,
  isListening: boolean,
  paused: boolean,
): string {
  if (paused) return 'Paused'
  if (isSpeaking || phase === 'speaking') return 'Speaking…'
  if (phase === 'thinking') return 'Thinking…'
  if (isListening || phase === 'listening') return 'Listening…'
  if (phase === 'starting') return 'Preparing voice…'
  if (phase === 'error') return 'Voice unavailable'
  if (phase === 'complete') return 'Session complete'
  return 'Ready'
}

export function InterviewerPanel({
  phase,
  error,
  isSpeaking,
  paused = false,
  isListening = false,
  speechSupported = true,
  showPlayButton = false,
  onRetry,
  onPlayIntroduction,
  onSubmit,
  submitDisabled = false,
}: InterviewerPanelProps) {
  const showLoader = phase === 'starting' || phase === 'thinking'
  const waveformActive =
    !paused && (isSpeaking || isListening || phase === 'starting' || phase === 'thinking')

  const helperLine = paused
    ? 'Interview audio is paused with the session.'
    : isSpeaking
      ? 'Listen to your tutor — the problem is on the left.'
      : isListening
        ? 'Mic is on — speak when ready.'
        : phase === 'thinking'
          ? 'Just a moment…'
          : phase === 'starting'
            ? 'Getting ready…'
            : 'Voice interview session'

  return (
    <div className="flex min-h-0 flex-col bg-bg-secondary/30">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple shadow-lg shadow-accent-blue/20">
          {showLoader ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : isSpeaking ? (
            <Volume2 className="h-8 w-8 text-white" />
          ) : isListening ? (
            <Mic className="h-8 w-8 animate-pulse text-white" />
          ) : (
            <Bot className="h-8 w-8 text-white" />
          )}
        </div>

        <p className="mt-4 text-sm font-medium text-text-primary">AI Tutor</p>
        <p
          className={`mt-1 text-xs ${
            phase === 'error' ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {statusLabel(phase, isSpeaking, isListening, paused)}
        </p>

        <div className="mt-6 w-full max-w-xs rounded-xl border border-white/10 bg-bg-primary/60 p-4">
          <Waveform active={waveformActive} />
          <p className="mt-3 text-xs leading-relaxed text-text-secondary">{helperLine}</p>
        </div>

        {!speechSupported && phase === 'listening' && !paused && (
          <p className="mt-3 max-w-xs text-xs text-amber-400/90">
            Microphone capture is unavailable in this browser.
          </p>
        )}

        {(showPlayButton || error?.includes('Play introduction')) && onPlayIntroduction && (
          <button
            type="button"
            onClick={onPlayIntroduction}
            disabled={isSpeaking || phase === 'starting' || paused}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Play introduction
          </button>
        )}

        {error && (
          <div className="mt-4 w-full max-w-xs rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
            {error}
            {onRetry && phase === 'error' && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 block w-full text-xs font-medium text-rose-200 underline underline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {onSubmit && (
        <div className="shrink-0 border-t border-white/10 px-3 py-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              className="rounded-md bg-linear-to-r from-accent-blue to-accent-purple px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-accent-blue/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

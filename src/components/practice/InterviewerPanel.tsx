import { Bot, Loader2, Mic, Play, Send, Volume2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewerPanelProps {
  phase: InterviewPhase
  error: string | null
  isSpeaking: boolean
  paused?: boolean
  isListening?: boolean
  interimTranscript?: string
  speechSupported?: boolean
  showPlayButton?: boolean
  onRetry?: () => void
  onPlayIntroduction?: () => void
  onSubmitMessage?: (text: string) => void
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
  if (phase === 'ready') return 'Take your time to read'
  return 'Ready'
}

export function InterviewerPanel({
  phase,
  error,
  isSpeaking,
  paused = false,
  isListening = false,
  interimTranscript = '',
  speechSupported = true,
  showPlayButton = false,
  onRetry,
  onPlayIntroduction,
  onSubmitMessage,
}: InterviewerPanelProps) {
  const [typedMessage, setTypedMessage] = useState('')
  const showInput =
    Boolean(onSubmitMessage) && !paused && phase !== 'starting' && phase !== 'error'
  const waveformActive =
    !paused && (isSpeaking || isListening || phase === 'starting' || phase === 'thinking')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const text = typedMessage.trim()
    if (!text || !onSubmitMessage || phase === 'thinking' || isSpeaking) return
    onSubmitMessage(text)
    setTypedMessage('')
  }

  return (
    <div className="flex min-h-0 flex-col bg-bg-secondary/30">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple shadow-lg shadow-accent-blue/20">
          {phase === 'starting' || phase === 'thinking' ? (
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
          <p className="mt-3 text-xs leading-relaxed text-text-secondary">
            {paused
              ? 'Interview audio is paused with the session.'
              : isSpeaking
              ? 'Listen to your tutor — the problem is on the left.'
              : isListening
                ? interimTranscript
                  ? `"${interimTranscript}"`
                  : 'Speak your answer — mic is on.'
                : phase === 'thinking'
                  ? 'Preparing a follow-up…'
                  : phase === 'listening'
                    ? 'Respond when ready — use the box below if you prefer typing.'
                    : phase === 'starting'
                      ? 'Generating voice…'
                      : 'Voice interview session'}
          </p>
        </div>

        {!speechSupported && phase === 'listening' && (
          <p className="mt-3 max-w-xs text-xs text-amber-400/90">
            Microphone capture is unavailable — type your responses below.
          </p>
        )}

        {showInput && (
          <form onSubmit={handleSubmit} className="mt-4 flex w-full max-w-xs gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(event) => setTypedMessage(event.target.value)}
              disabled={isSpeaking || phase === 'thinking'}
              placeholder="Type a response…"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-blue/40 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim() || isSpeaking || phase === 'thinking'}
              className="inline-flex items-center justify-center rounded-lg bg-accent-blue/20 px-3 py-2 text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}

        {(showPlayButton || error?.includes('Play introduction')) && onPlayIntroduction && (
          <button
            type="button"
            onClick={onPlayIntroduction}
            disabled={isSpeaking || phase === 'starting'}
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
    </div>
  )
}

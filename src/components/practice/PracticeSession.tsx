import { motion } from 'framer-motion'
import {
  Bot,
  CheckCircle2,
  Loader2,
  Mic,
  Pause,
  Play,
  Send,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Question } from '../../data/questions'
import { aiMessages } from '../../data/mockInterview'

function Waveform() {
  const bars = Array.from({ length: 24 }, (_, i) => ({
    height: 20 + Math.sin(i * 0.8) * 16 + ((i * 7) % 12),
    delay: i * 0.05,
  }))

  return (
    <div className="flex h-12 items-end justify-center gap-0.5 px-2">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-accent-blue/80"
          style={{ height: bar.height }}
          animate={{ scaleY: [0.4, 1, 0.6, 0.9, 0.4] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: bar.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

interface PracticeSessionProps {
  question: Question
}

export function PracticeSession({ question }: PracticeSessionProps) {
  const [code, setCode] = useState(question.starterCode)
  const [timerRunning, setTimerRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  return (
    <motion.div
      className="glass glow-blue overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text-primary">{question.title}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              question.difficulty === 'Easy'
                ? 'bg-emerald-500/15 text-emerald-400'
                : question.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-sm">
            {timerRunning && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            )}
            <span className="text-rose-400">{formatTime(elapsed)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10"
          >
            {timerRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="border-b border-white/10 lg:border-r lg:border-b-0">
          <div className="border-b border-white/10 bg-bg-secondary/40 p-4">
            <p className="text-sm leading-relaxed text-text-secondary">{question.description}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {question.examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-bg-primary/60 px-3 py-2 font-mono text-xs"
                >
                  <span className="text-text-secondary">{ex.input}</span>
                  <span className="text-emerald-400"> → {ex.output}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_220px]">
            <div className="relative border-b border-white/10 lg:border-b-0">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="min-h-[320px] w-full resize-y bg-bg-primary/90 p-4 font-mono text-xs leading-relaxed text-text-primary/90 outline-none lg:min-h-[400px]"
                aria-label="Code editor"
              />
            </div>

            <div className="bg-bg-secondary/40 p-3">
              <p className="mb-2 text-xs font-medium tracking-wider text-text-secondary uppercase">
                Test Cases
              </p>
              <div className="space-y-2">
                {question.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-bg-primary/60 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 text-text-secondary/50" />
                      )}
                      <span className="text-xs font-medium text-text-primary">
                        Case {i + 1}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-text-secondary">{ex.input}</p>
                    <p className="font-mono text-[10px] text-emerald-400/90">→ {ex.output}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue/20 py-2 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/30"
              >
                Run tests
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-bg-secondary/30">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-accent-blue to-accent-purple">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">AI Interviewer</p>
                <p className="text-xs text-emerald-400">Session active</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-bg-primary/60 p-3">
              <Waveform />
              <div className="mt-2 flex items-center justify-center gap-2">
                <Mic className="h-3.5 w-3.5 text-accent-blue" />
                <span className="text-xs text-text-secondary">Explain your approach out loud</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto p-4">
            {aiMessages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm leading-relaxed ${
                  msg.role === 'interviewer'
                    ? 'border border-white/10 bg-bg-primary/80 text-text-primary'
                    : 'border border-accent-blue/20 bg-accent-blue/10 text-accent-blue'
                }`}
              >
                {msg.role === 'hint' && (
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider opacity-70">
                    Hint
                  </span>
                )}
                {msg.text}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple py-2.5 text-sm font-medium text-white"
            >
              <Send className="h-4 w-4" />
              Submit solution
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

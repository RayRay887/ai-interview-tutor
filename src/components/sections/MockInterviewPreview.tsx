import { motion } from 'framer-motion'
import {
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Mic,
  Pause,
  Play,
} from 'lucide-react'
import { aiMessages, terminalCode, testCases } from '../../data/mockInterview'
import { SectionHeading } from '../ui/SectionHeading'

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

export function MockInterviewPreview() {
  const codeLines = terminalCode.split('\n')

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Live Demo"
          title="See the interview room"
          description="A realistic split-pane experience — code on the left, AI interviewer on the right."
        />

        <motion.div
          className="glass glow-blue mt-16 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-sm font-medium text-text-primary">
                Pair Target Indices — Mock Interview
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                Easy
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                <span className="text-rose-400">32:14</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="border-b border-white/10 lg:border-r lg:border-b-0">
              <div className="flex border-b border-white/10 bg-bg-primary/50 text-xs text-text-secondary">
                <span className="border-b-2 border-accent-blue px-4 py-2 text-text-primary">
                  solution.py
                </span>
                <span className="px-4 py-2 hover:text-text-primary">test_results</span>
              </div>

              <div className="grid lg:grid-cols-[1fr_240px]">
                <div className="max-h-[280px] overflow-auto border-b border-white/10 p-4 font-mono text-xs leading-relaxed lg:max-h-[360px] lg:border-b-0">
                  {codeLines.map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="w-5 shrink-0 text-text-secondary/30">{i + 1}</span>
                      <span
                        className={
                          line.startsWith('def')
                            ? 'text-accent-purple'
                            : line.includes('return')
                              ? 'text-accent-blue'
                              : 'text-text-primary/85'
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-bg-secondary/40 p-3">
                  <p className="mb-2 text-xs font-medium tracking-wider text-text-secondary uppercase">
                    Test Cases
                  </p>
                  <div className="space-y-2">
                    {testCases.map((tc, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-bg-primary/60 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          {tc.status === 'passed' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          {tc.status === 'running' && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-blue" />
                          )}
                          {tc.status !== 'passed' && tc.status !== 'running' && (
                            <Circle className="h-3.5 w-3.5 text-text-secondary" />
                          )}
                          <span className="text-xs font-medium text-text-primary">
                            Case {i + 1}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-text-secondary">
                          {tc.input}
                        </p>
                        <p className="font-mono text-[10px] text-emerald-400/90">
                          → {tc.output}
                        </p>
                      </div>
                    ))}
                  </div>
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
                    <p className="text-xs text-emerald-400">Listening…</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-bg-primary/60 p-3">
                  <Waveform />
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Mic className="h-3.5 w-3.5 text-accent-blue" />
                    <span className="text-xs text-text-secondary">Voice activity detected</span>
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
                  <Play className="h-4 w-4" />
                  Continue speaking
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

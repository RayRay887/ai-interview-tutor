import { motion } from 'framer-motion'
import { terminalCode } from '../../data/mockInterview'

export function TerminalPreview() {
  const lines = terminalCode.split('\n')

  return (
    <motion.div
      className="glass glow-blue relative overflow-hidden rounded-xl border border-white/10 shadow-2xl"
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      style={{ perspective: 1000 }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-bg-secondary/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="ml-2 font-mono text-xs text-text-secondary">
          pair_target.py — Prepify Interview
        </span>
      </div>

      <div className="relative bg-bg-primary/90 p-4 font-mono text-sm leading-relaxed">
        <div className="absolute top-0 right-0 h-32 w-32 bg-accent-blue/10 blur-3xl" />
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-6 shrink-0 select-none text-right text-text-secondary/40">
              {i + 1}
            </span>
            <span className="text-text-primary/90">
              {i === 0 ? (
                <>
                  <span className="text-accent-purple">def </span>
                  <span className="text-accent-blue">pair_target_indices</span>
                  <span className="text-text-secondary">
                    (values: list[int], target: int) -&gt; list[int]:
                  </span>
                </>
              ) : (
                <span
                  className={
                    line.includes('return')
                      ? 'text-accent-purple'
                      : line.includes('#') || line.includes('complement')
                        ? 'text-emerald-400/80'
                        : 'text-text-primary/80'
                  }
                >
                  {line}
                </span>
              )}
            </span>
          </div>
        ))}
        <span className="terminal-cursor ml-10" />
      </div>

      <div className="border-t border-white/10 bg-bg-secondary/60 px-4 py-2 font-mono text-xs text-emerald-400">
        ✓ All test cases passed · O(n) time · O(n) space
      </div>
    </motion.div>
  )
}

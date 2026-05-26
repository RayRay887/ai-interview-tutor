import { AlertCircle, CheckCircle2, Info, Terminal, TriangleAlert } from 'lucide-react'
import type { ConsoleEntry } from '../../lib/codeRunner'
import { CollapsibleSection } from './CollapsibleSection'

interface ConsolePanelProps {
  entries: ConsoleEntry[]
}

const levelStyles: Record<
  ConsoleEntry['level'],
  { icon: typeof Info; className: string }
> = {
  info: { icon: Info, className: 'text-accent-blue' },
  success: { icon: CheckCircle2, className: 'text-emerald-400' },
  error: { icon: AlertCircle, className: 'text-rose-400' },
  warn: { icon: TriangleAlert, className: 'text-amber-400' },
}

export function ConsolePanel({ entries }: ConsolePanelProps) {
  const errorCount = entries.filter((entry) => entry.level === 'error').length

  return (
    <CollapsibleSection
      title="Console"
      icon={<Terminal className="h-3.5 w-3.5 text-accent-blue" />}
      badge={
        errorCount > 0 ? (
          <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-400 normal-case">
            {errorCount} error{errorCount === 1 ? '' : 's'}
          </span>
        ) : entries.length > 0 ? (
          <span className="text-[10px] font-medium text-text-secondary/70 normal-case">
            {entries.length} log{entries.length === 1 ? '' : 's'}
          </span>
        ) : null
      }
      contentClassName="border-t border-white/10 bg-bg-primary/90"
    >
      <div className="theme-scrollbar max-h-36 min-h-28 overflow-y-auto px-4 py-3">
        {entries.length === 0 ? (
          <p className="font-mono text-xs text-text-secondary/70">
            Run tests to see compile errors, runtime issues, and results here.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const { icon: Icon, className } = levelStyles[entry.level]

              return (
                <div key={entry.id} className="flex gap-2 font-mono text-xs">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${className}`} />
                  <div className="min-w-0">
                    <p className={`leading-relaxed ${className}`}>
                      {entry.line ? `Line ${entry.line}` : 'Log'}
                      {entry.column ? `:${entry.column}` : ''}
                      {entry.line ? ' — ' : ''}
                      {entry.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-secondary/70 uppercase">
                      {entry.source}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

import type { ReactNode } from 'react'
import { CheckCircle2, TrendingUp } from 'lucide-react'
import type { FeedbackSection, OptimizationSection } from '../../types/feedback'

function scoreBarColor(score: number): string {
  if (score >= 4) return 'bg-emerald-500'
  if (score >= 3) return 'bg-accent-blue'
  if (score >= 2) return 'bg-amber-500'
  return 'bg-rose-500'
}

interface FeedbackSectionCardProps {
  title: string
  subtitle: string
  icon: ReactNode
  section: FeedbackSection
  accentClass?: string
  extra?: ReactNode
}

export function FeedbackSectionCard({
  title,
  subtitle,
  icon,
  section,
  accentClass = 'text-accent-blue',
  extra,
}: FeedbackSectionCardProps) {
  return (
    <section className="glass rounded-2xl border border-white/10 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ${accentClass}`}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text-primary">{section.score}</p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Section score</p>
        </div>
      </div>

      {extra}

      <ul className="space-y-3">
        {section.criteria.map((criterion) => (
          <li
            key={criterion.id}
            className="rounded-xl border border-white/10 bg-bg-primary/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-text-primary">{criterion.name}</p>
              <span className="text-xs text-text-secondary">{criterion.score}/4</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${scoreBarColor(criterion.score)}`}
                style={{ width: `${(criterion.score / 4) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{criterion.summary}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="mt-3 space-y-2">
            {section.strengths.map((item) => (
              <li key={item} className="text-xs leading-relaxed text-text-secondary">
                • {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-amber-300">
            <TrendingUp className="h-4 w-4" />
            To improve
          </h3>
          <ul className="mt-3 space-y-2">
            {section.improvements.map((item) => (
              <li key={item} className="text-xs leading-relaxed text-text-secondary">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function OptimizationExtras({ section }: { section: OptimizationSection }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-bg-primary/40 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
          Time complexity
        </p>
        <p className="mt-1 font-mono text-sm text-text-primary">{section.timeComplexity}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-bg-primary/40 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
          Space complexity
        </p>
        <p className="mt-1 font-mono text-sm text-text-primary">{section.spaceComplexity}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-bg-primary/40 p-3 sm:col-span-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
          Optimal solution
        </p>
        <p className="mt-1 text-sm text-text-primary">
          {section.isOptimal ? 'Yes — near or at optimal' : 'No — room for improvement'}
        </p>
        {section.optimizationSummary && (
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            {section.optimizationSummary}
          </p>
        )}
      </div>
    </div>
  )
}

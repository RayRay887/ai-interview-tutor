import type { Difficulty } from '../../data/questions'

const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

interface BadgeProps {
  label: string
  variant?: Difficulty | 'default'
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const style =
    variant === 'default'
      ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
      : difficultyStyles[variant]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  )
}

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Question } from '../../data/questions'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface QuestionCardProps {
  question: Question
  index: number
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  return (
    <motion.article
      className="glass glass-hover flex flex-col rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Badge label={question.difficulty} variant={question.difficulty} />
        <span className="flex items-center gap-1 text-xs text-text-secondary">
          <Clock className="h-3.5 w-3.5" />
          {question.duration}
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-text-primary">{question.title}</h2>
      <p className="mt-1 text-xs font-medium text-accent-blue/80">{question.category}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
        {question.description}
      </p>

      {question.examples.length > 0 && (
        <div className="mt-4 rounded-lg border border-white/10 bg-bg-primary/50 p-3">
          <p className="text-[10px] font-medium tracking-wider text-text-secondary uppercase">
            Example
          </p>
          <p className="mt-1 font-mono text-xs text-text-secondary">{question.examples[0].input}</p>
          <p className="font-mono text-xs text-emerald-400/90">
            → {question.examples[0].output}
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button to={`/practice/${question.slug}`} variant="primary" className="flex-1">
          Start Practicing
        </Button>
        <Link
          to={`/practice/${question.slug}`}
          className="glass flex items-center justify-center rounded-lg px-4 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Details
        </Link>
      </div>
    </motion.article>
  )
}

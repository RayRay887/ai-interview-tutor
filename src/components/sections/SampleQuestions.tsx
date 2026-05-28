import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSignInModal } from '../../context/SignInModalContext'
import { featuredQuestions } from '../../data/questions'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'

export function SampleQuestions() {
  const { user } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()

  const handleStartPracticing = (slug: string) => {
    const path = `/practice/${slug}`
    if (user) {
      navigate(path)
      return
    }
    openSignIn({ redirectTo: path })
  }

  return (
    <section id="samples" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg-secondary/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Practice Questions"
          title="Start with popular problems"
          description="Pair Target Indices, Zero-Sum Triplets, and more — pick a question and jump into a mock interview session."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {featuredQuestions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <button
                type="button"
                onClick={() => handleStartPracticing(question.slug)}
                className="glass glass-hover group block w-full rounded-2xl p-6 text-left transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge label={question.difficulty} variant={question.difficulty} />
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    {question.duration}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-text-primary transition-colors group-hover:text-accent-blue">
                  {question.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                  {question.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-text-secondary">{question.category}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-accent-blue opacity-0 transition-opacity group-hover:opacity-100">
                    Start practicing
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Button to="/questions" variant="secondary">
            View all questions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

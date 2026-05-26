import { motion } from 'framer-motion'
import { questions } from '../data/questions'
import { QuestionCard } from '../components/questions/QuestionCard'
import { GradientText } from '../components/ui/GradientText'

export function QuestionsPage() {
  return (
    <main className="relative pt-28 pb-20 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-3 text-sm font-medium tracking-widest text-accent-blue uppercase">
            Question Bank
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            <GradientText as="span">All practice questions</GradientText>
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Choose a problem, read the description, and start a mock interview session.
            Each question includes difficulty, examples, and an AI interviewer.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>
      </div>
    </main>
  )
}

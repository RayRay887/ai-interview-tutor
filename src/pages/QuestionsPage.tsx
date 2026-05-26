import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { QuestionCard } from '../components/questions/QuestionCard'
import { GradientText } from '../components/ui/GradientText'
import type { Difficulty } from '../data/questions'
import { questionCount, questions } from '../data/questions'

const categories = [...new Set(questions.map((q) => q.category))].sort()
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard']

export function QuestionsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('All')
  const [difficulty, setDifficulty] = useState<string>('All')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return questions.filter((q) => {
      if (category !== 'All' && q.category !== category) return false
      if (difficulty !== 'All' && q.difficulty !== difficulty) return false
      if (!query) return true
      return (
        q.title.toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query)
      )
    })
  }, [search, category, difficulty])

  return (
    <main className="relative pt-28 pb-20 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 max-w-2xl"
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
            {questionCount}+ curated problems across arrays, trees, dynamic programming, and
            more. Choose a problem and start a mock interview session.
          </p>
        </motion.div>

        <div className="glass mb-10 flex flex-col gap-4 rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              placeholder="Search problems…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-accent-blue/50"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue/50"
            >
              <option value="All">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue/50"
            >
              <option value="All">All difficulties</option>
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="flex items-center text-sm text-text-secondary">
              Showing {filtered.length} of {questionCount}
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-text-secondary">
            No problems match your filters. Try a different search.
          </p>
        )}
      </div>
    </main>
  )
}

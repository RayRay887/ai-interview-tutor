import { motion } from 'framer-motion'
import { features } from '../../data/features'
import { SectionHeading } from '../ui/SectionHeading'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Features"
          title="Everything you need to ace the loop"
          description="From live coding to communication scoring — Prepify covers the full interview experience."
        />

        <motion.div
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.article
                key={feature.title}
                variants={item}
                className="glass glass-hover group -translate-y-0 rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-accent-blue/20 to-accent-purple/20 transition-shadow duration-300 group-hover:shadow-[0_0_24px_-4px_rgba(77,163,255,0.5)]">
                  <Icon className="h-5 w-5 text-accent-blue" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

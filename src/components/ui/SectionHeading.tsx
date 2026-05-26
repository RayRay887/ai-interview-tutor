import { motion } from 'framer-motion'
import { GradientText } from './GradientText'

interface SectionHeadingProps {
  label: string
  title: string
  description?: string
}

export function SectionHeading({ label, title, description }: SectionHeadingProps) {
  return (
    <motion.div
      className="mx-auto max-w-2xl text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <p className="mb-3 text-sm font-medium tracking-widest text-accent-blue uppercase">
        {label}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        <GradientText as="span">{title}</GradientText>
      </h2>
      {description && (
        <p className="mt-4 text-lg text-text-secondary">{description}</p>
      )}
    </motion.div>
  )
}

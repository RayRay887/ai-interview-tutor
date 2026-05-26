import { motion } from 'framer-motion'

export function BackgroundEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 grid-bg" />
      <motion.div
        className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-accent-blue/20 blur-[120px]"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-accent-purple/20 blur-[100px]"
        animate={{ opacity: [0.25, 0.45, 0.25], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-accent-blue/15 blur-[90px]"
        animate={{ opacity: [0.2, 0.4, 0.2], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="noise-overlay absolute inset-0" />
    </div>
  )
}

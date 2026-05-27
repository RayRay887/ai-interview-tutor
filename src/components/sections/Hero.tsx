import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Particles } from '../effects/Particles'
import { TerminalPreview } from '../hero/TerminalPreview'
import { Button } from '../ui/Button'
import { GradientText } from '../ui/GradientText'

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden pt-28 pb-20 sm:pt-32 lg:pt-36">
      <Particles count={35} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="glass mb-6 inline-flex items-center gap-2 rounded-full border border-accent-blue/20 px-4 py-1.5 text-xs font-medium text-accent-blue">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-blue opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-blue" />
                </span>
                AI-powered mock interviews
              </span>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-6 top-8 h-40 bg-linear-to-r from-accent-blue/15 via-accent-purple/25 to-accent-blue/15 blur-3xl sm:-inset-x-10 sm:top-10 sm:h-48"
              />

              <h1 className="relative max-w-xl">
                <span className="block text-[2rem] font-bold leading-none tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                  You Can&apos;t
                </span>
                <GradientText
                  as="span"
                  className="hero-headline-glow mt-1 block text-[3.25rem] font-extrabold leading-[0.92] tracking-[-0.04em] sm:mt-2 sm:text-7xl lg:text-8xl"
                >
                  Just Code
                </GradientText>
              </h1>

              <div className="relative mt-6 flex items-center gap-4 sm:mt-8">
                <span className="h-px w-10 shrink-0 bg-linear-to-r from-accent-blue/70 to-accent-purple/30 sm:w-14" />
                <p className="text-sm font-medium tracking-[0.18em] text-text-secondary uppercase sm:text-base">
                  Learn how to articulate
                </p>
                <span className="h-px w-10 shrink-0 bg-linear-to-l from-accent-blue/70 to-accent-purple/30 sm:w-14" />
              </div>
            </motion.div>

            <motion.p
              className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Prepify simulates realistic technical interviews with AI-powered
              coding, communication, and behavioral feedback.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button to="/questions" variant="primary">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/#demo" variant="secondary">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              className="mt-12 flex gap-8 border-t border-white/10 pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {[
                { value: 'Pair Target', label: 'Most practiced' },
                { value: 'Zero-Sum Triplets', label: 'Trending now' },
                { value: '100+', label: 'Practice problems' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-text-primary sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative">
            <motion.div
              className="absolute -inset-4 rounded-2xl bg-linear-to-br from-accent-blue/20 to-accent-purple/20 blur-2xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <TerminalPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

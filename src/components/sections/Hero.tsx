import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Particles } from '../effects/Particles'
import { TerminalPreview } from '../hero/TerminalPreview'
import { Button } from '../ui/Button'
import { GradientText } from '../ui/GradientText'

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28 pb-20 sm:pt-32 lg:pt-36">
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

            <motion.h1
              className="text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Coding is only{' '}
              <GradientText as="span" className="block sm:inline">
                half the interview.
              </GradientText>
            </motion.h1>

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
                { value: 'Two Sum', label: 'Most practiced' },
                { value: 'Three Sum', label: 'Trending now' },
                { value: '10+', label: 'Sample problems' },
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

import { motion } from 'framer-motion'
import { ArrowLeft, Menu, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { navLinks } from '../../data/nav'
import { Button } from '../ui/Button'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPractice = location.pathname.startsWith('/practice/')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const showBlur = scrolled || !isHome || isPractice

  const brand = (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-accent-blue to-accent-purple shadow-lg shadow-accent-blue/30">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-text-primary">Prepify</span>
    </div>
  )

  const backLink = (
    <Link
      to="/questions"
      className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent-blue"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back to questions</span>
      <span className="sm:hidden">Back</span>
    </Link>
  )

  return (
    <motion.header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        showBlur
          ? 'border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {isPractice ? (
        <nav className="relative mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="justify-self-start">{backLink}</div>
          <div className="justify-self-center">{brand}</div>
          <div aria-hidden="true" />
        </nav>
      ) : (
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">{brand}</Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Button to="/questions" variant="primary">
              Start Practicing
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary hover:bg-white/5 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      )}

      {!isPractice && mobileOpen && (
        <motion.div
          className="border-t border-white/10 bg-bg-primary/95 px-4 py-4 backdrop-blur-xl md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Button to="/questions" variant="primary" className="w-full">
              Start Practicing
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}

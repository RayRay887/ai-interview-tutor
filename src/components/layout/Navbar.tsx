import { motion } from 'framer-motion'
import { ArrowLeft, LogIn, LogOut, Menu, User, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSignInModal } from '../../context/SignInModalContext'
import { stopAllInterviewAudio } from '../../hooks/useInterviewerTTS'
import { navLinks } from '../../data/nav'
import { PrepifyLogo } from '../brand/PrepifyLogo'
import { NavLinkItem } from './NavLinkItem'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const handleSignOut = async () => {
    setProfileOpen(false)
    setMobileOpen(false)
    await signOut()
    navigate('/')
  }

  const isHome = location.pathname === '/'
  const isPractice = location.pathname.startsWith('/practice/')
  const isQuestionsPage = location.pathname === '/questions'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [profileOpen])

  const showBlur = scrolled || !isHome || isPractice

  const brand = <PrepifyLogo size="md" to="/" linked />

  const handleBackToQuestions = () => {
    stopAllInterviewAudio()
    navigate('/questions')
  }

  const backLink = (
    <button
      type="button"
      onClick={handleBackToQuestions}
      className="relative z-10 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent-blue"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back to questions</span>
      <span className="sm:hidden">Back</span>
    </button>
  )

  const startPracticingButton = !isQuestionsPage ? (
    <Button to="/questions" variant={user ? 'primary' : 'secondary'}>
      Start Practicing
    </Button>
  ) : null

  const authButtonsDesktop = user ? (
    <div className="flex items-center gap-4">
      {startPracticingButton}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">{user.name.split(' ')[0]}</span>
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent-blue transition-colors hover:bg-white/10"
            aria-label="Account menu"
            aria-expanded={profileOpen}
          >
            <User className="h-4 w-4" />
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 min-w-[10rem] rounded-xl border border-white/10 bg-bg-secondary py-1 shadow-xl">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      {startPracticingButton}
      <button
        type="button"
        onClick={() => openSignIn({ initialMode: 'signup' })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-white/5"
      >
        <UserPlus className="h-4 w-4" />
        Sign up
      </button>
      <button
        type="button"
        onClick={() => openSignIn({ initialMode: 'signin' })}
        className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-4 py-2 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90"
      >
        <LogIn className="h-4 w-4" />
        Log in
      </button>
    </div>
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
        <nav className="relative isolate mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative z-10 justify-self-start">{backLink}</div>
          <div className="relative z-[1] justify-self-center">{brand}</div>
          <div aria-hidden="true" />
        </nav>
      ) : (
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>{brand}</div>

          <div className="hidden items-center gap-5 lg:gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLinkItem
                key={link.label}
                link={link}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              />
            ))}
          </div>

          <div className="hidden md:flex">{authButtonsDesktop}</div>

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
              <NavLinkItem
                key={link.label}
                link={link}
                className="text-sm text-text-secondary hover:text-text-primary"
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
            {user ? (
              <>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <User className="h-4 w-4 text-accent-blue" />
                  Signed in as {user.name}
                </p>
                {!isQuestionsPage && (
                  <Button to="/questions" variant="primary" className="w-full">
                    Start Practicing
                  </Button>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm text-text-secondary hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                {!isQuestionsPage && (
                  <Button to="/questions" variant="secondary" className="w-full">
                    Start Practicing
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    openSignIn({ initialMode: 'signup' })
                    setMobileOpen(false)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-text-primary hover:bg-white/5"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openSignIn({ initialMode: 'signin' })
                    setMobileOpen(false)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple py-2.5 text-sm font-medium text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}

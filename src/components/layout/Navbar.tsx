import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, LogIn, LogOut, Menu, User, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSignInModal } from '../../context/SignInModalContext'
import { usePracticeAttemptOptional } from '../../context/PracticeAttemptContext'
import { stopAllInterviewAudio } from '../../hooks/useInterviewerTTS'
import { navLinks } from '../../data/nav'
import { PrepifyLogo } from '../brand/PrepifyLogo'
import { NavLinkItem } from './NavLinkItem'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { openSignIn } = useSignInModal()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const practiceAttempt = usePracticeAttemptOptional()

  const handleSignOut = async () => {
    setProfileOpen(false)
    setMobileOpen(false)
    setSignOutConfirmOpen(false)
    await signOut()
    navigate('/')
  }

  const requestSignOut = () => {
    setProfileOpen(false)
    setSignOutConfirmOpen(true)
  }

  const isHome = location.pathname === '/'
  const isPractice = location.pathname.startsWith('/practice/')
  const isDashboard = location.pathname === '/dashboard'

  const goToDashboard = () => {
    navigate('/dashboard')
    setMobileOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
    setSignOutConfirmOpen(false)
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

  useEffect(() => {
    if (!signOutConfirmOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSignOutConfirmOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [signOutConfirmOpen])

  const showBlur = scrolled || !isHome || isPractice

  const brand = <PrepifyLogo size="md" to="/" linked />

  const handleBackToQuestions = () => {
    stopAllInterviewAudio()
    void practiceAttempt?.abandonSession()
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

  const authButtonsDesktop = user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToDashboard}
          className={`text-sm transition-colors hover:text-text-primary ${
            isDashboard ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {user.name.split(' ')[0]}
        </button>
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
                onClick={requestSignOut}
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
    <>
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
          <nav className="relative isolate mx-auto grid w-full max-w-[100rem] grid-cols-[1fr_auto_1fr] items-center px-2 py-4 sm:px-3 lg:px-4">
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
                  <button
                    type="button"
                    onClick={goToDashboard}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                  >
                    <User className="h-4 w-4 text-accent-blue" />
                    Signed in as {user.name}
                  </button>
                  <button
                    type="button"
                    onClick={requestSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm text-text-secondary hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
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

      <AnimatePresence>
        {signOutConfirmOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSignOutConfirmOpen(false)}
          >
            <motion.div
              className="glass glow-blue w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sign-out-title"
            >
              <h2 id="sign-out-title" className="text-lg font-semibold text-text-primary">
                Sign out?
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Are you sure you want to sign out?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSignOutConfirmOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

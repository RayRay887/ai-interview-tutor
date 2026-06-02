import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { usePracticeAttempt } from '../../context/PracticeAttemptContext'

function isFeedbackNavigation(pathname: string) {
  return pathname.startsWith('/feedback/')
}

export function PracticeLeaveGuard() {
  const { leaveProtectionEnabled, isLeaveProtectionActive, openLeaveConfirmFromBlocker } =
    usePracticeAttempt()

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (isFeedbackNavigation(nextLocation.pathname)) return false
    return (
      isLeaveProtectionActive() &&
      currentLocation.pathname !== nextLocation.pathname
    )
  })

  useEffect(() => {
    if (blocker.state !== 'blocked' || !leaveProtectionEnabled) return

    openLeaveConfirmFromBlocker(
      () => blocker.proceed(),
      () => blocker.reset(),
    )
  }, [blocker.state, leaveProtectionEnabled, openLeaveConfirmFromBlocker, blocker])

  useEffect(() => {
    if (!leaveProtectionEnabled) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [leaveProtectionEnabled])

  return null
}

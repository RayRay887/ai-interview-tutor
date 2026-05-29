import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Question } from '../data/questions'
import { getSessionOpening } from '../lib/interviewApi'
import { toInterviewQuestionContext, type InterviewPhase } from '../types/interview'
import { useInterviewerTTS } from './useInterviewerTTS'

interface UseInterviewSessionOptions {
  question: Question
  enabled?: boolean
}

export function useInterviewSession({ question, enabled = true }: UseInterviewSessionOptions) {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const { speak, stop, isSpeaking, playBlocked, playPending } = useInterviewerTTS()

  const questionContext = useMemo(
    () => toInterviewQuestionContext(question),
    [question],
  )

  const startSession = useCallback(async () => {
    setPhase('starting')
    setError(null)

    const opening = getSessionOpening(questionContext)

    try {
      setPhase('speaking')
      await speak(opening)
      setPhase('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not play the introduction.'
      if (message.includes('Play introduction')) {
        setPhase('ready')
        setError(message)
        return
      }
      setPhase('error')
      setError(message)
    }
  }, [questionContext, speak])

  useEffect(() => {
    if (!enabled) return

    void startSession()

    return () => {
      stop()
    }
  }, [enabled, question.slug, startSession, stop])

  const isBusy = phase === 'starting' || isSpeaking

  const retryStart = useCallback(() => {
    stop()
    void startSession()
  }, [startSession, stop])

  const playIntroduction = useCallback(async () => {
    setError(null)
    setPhase('speaking')
    try {
      await playPending()
      setPhase('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not play audio.')
      setPhase('error')
    }
  }, [playPending])

  return {
    phase,
    error,
    isSpeaking,
    isBusy,
    playBlocked,
    retryStart,
    playIntroduction,
  }
}

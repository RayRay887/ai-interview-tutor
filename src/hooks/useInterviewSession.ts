import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../data/questions'
import {
  getSessionOpening,
  requestInterviewTurn,
  type InterviewTurnRequest,
} from '../lib/interviewApi'
import {
  buildInterviewerContext,
  candidateAskedForHint,
  type PracticeSessionSnapshot,
} from '../prompts/interviewer/sessionSnapshot'
import type { HintLevel, InterviewerTranscriptEntry } from '../prompts/interviewer/types'
import { toInterviewQuestionContext, type InterviewPhase } from '../types/interview'
import { useInterviewerTTS } from './useInterviewerTTS'
import { useWhisperCapture } from './useWhisperCapture'

interface UseInterviewSessionOptions {
  question: Question
  microphoneDeviceId: string
  enabled?: boolean
  paused?: boolean
  getSnapshot: () => PracticeSessionSnapshot
  onTestsJustRunConsumed?: () => void
}

function toTurnMessages(transcript: InterviewerTranscriptEntry[]) {
  return transcript.map(({ role, text }) => ({ role, text }))
}

export function useInterviewSession({
  question,
  microphoneDeviceId,
  enabled = true,
  paused = false,
  getSnapshot,
  onTestsJustRunConsumed,
}: UseInterviewSessionOptions) {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<InterviewerTranscriptEntry[]>([])
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)

  const { speak, stop, isSpeaking, playBlocked, playPending } = useInterviewerTTS()

  const getSnapshotRef = useRef(getSnapshot)
  const onTestsJustRunConsumedRef = useRef(onTestsJustRunConsumed)
  const codeAtLastTurnRef = useRef('')
  const sessionStartRef = useRef(Date.now())
  const lastCandidateSpeechRef = useRef(Date.now())
  const processingRef = useRef(false)
  const conversationStartedRef = useRef(false)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    getSnapshotRef.current = getSnapshot
  }, [getSnapshot])

  useEffect(() => {
    onTestsJustRunConsumedRef.current = onTestsJustRunConsumed
  }, [onTestsJustRunConsumed])

  const questionContext = useMemo(
    () => toInterviewQuestionContext(question),
    [question],
  )

  const appendTranscript = useCallback((role: InterviewerTranscriptEntry['role'], text: string) => {
    const entry: InterviewerTranscriptEntry = {
      role,
      text,
      timestamp: Date.now() - sessionStartRef.current,
    }
    setTranscript((current) => [...current, entry])
    return entry
  }, [])

  const buildTurnRequest = useCallback(
    (userMessage: string, transcriptForTurn: InterviewerTranscriptEntry[]): InterviewTurnRequest => {
      const snapshot = getSnapshotRef.current()
      const silenceSeconds = Math.round((Date.now() - lastCandidateSpeechRef.current) / 1000)
      const context = buildInterviewerContext(
        question,
        snapshot,
        transcriptForTurn,
        hintLevel,
        codeAtLastTurnRef.current,
        silenceSeconds,
      )

      context.signals.candidateAskedForHint = candidateAskedForHint(userMessage)

      codeAtLastTurnRef.current = snapshot.code
      if (snapshot.testsJustRun) {
        onTestsJustRunConsumedRef.current?.()
      }

      return {
        question: questionContext,
        messages: toTurnMessages(transcriptForTurn),
        userMessage,
        code: {
          source: context.code.source,
          changedSinceLastTurn: context.code.changedSinceLastTurn,
          lineCount: context.code.lineCount,
        },
        console: context.console,
        tests: context.tests,
        session: context.session,
        signals: context.signals,
        hintState: context.hintState,
      }
    },
    [question, questionContext, hintLevel],
  )

  const deliverReply = useCallback(
    async (reply: string, role: 'interviewer' | 'hint') => {
      appendTranscript(role, reply)
      if (role === 'hint') {
        setHintLevel((current) => Math.min(4, current + 1) as HintLevel)
      }
      setPhase('speaking')
      await speak(reply)
      if (pausedRef.current) return
      setPhase('listening')
    },
    [appendTranscript, speak],
  )

  const handleCandidateMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || processingRef.current || paused) return

      processingRef.current = true
      lastCandidateSpeechRef.current = Date.now()
      setError(null)
      setPhase('thinking')

      const candidateEntry = appendTranscript('candidate', text)
      const transcriptForTurn = [...transcript, candidateEntry]

      try {
        const turn = await requestInterviewTurn(buildTurnRequest(text, transcriptForTurn))
        if (pausedRef.current) return
        await deliverReply(turn.reply, turn.role)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not reach the interviewer.'
        setError(message)
        setPhase('listening')
      } finally {
        processingRef.current = false
      }
    },
    [appendTranscript, buildTurnRequest, deliverReply, paused, transcript],
  )

  const submitMessage = useCallback(
    (text: string) => {
      void handleCandidateMessage(text)
    },
    [handleCandidateMessage],
  )

  const canListen =
    enabled &&
    !paused &&
    conversationStartedRef.current &&
    phase === 'listening' &&
    !isSpeaking

  const speech = useWhisperCapture({
    enabled: canListen,
    deviceId: microphoneDeviceId,
    onUtterance: (text) => {
      void handleCandidateMessage(text)
    },
  })

  const startSession = useCallback(async () => {
    setPhase('starting')
    setError(null)
    setTranscript([])
    setHintLevel(0)
    codeAtLastTurnRef.current = getSnapshotRef.current().code
    sessionStartRef.current = Date.now()
    lastCandidateSpeechRef.current = Date.now()
    conversationStartedRef.current = false
    processingRef.current = false

    const opening = getSessionOpening(questionContext)

    try {
      setPhase('speaking')
      await speak(opening)
      if (pausedRef.current) return
      appendTranscript('interviewer', opening)
      conversationStartedRef.current = true
      setPhase('listening')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not play the introduction.'
      if (message.includes('Play introduction')) {
        appendTranscript('interviewer', opening)
        conversationStartedRef.current = true
        setPhase('listening')
        setError(message)
        return
      }
      setPhase('error')
      setError(message)
    }
  }, [appendTranscript, questionContext, speak])

  useEffect(() => {
    if (!enabled) return

    void startSession()

    return () => {
      stop()
      speech.stop()
      processingRef.current = false
    }
  }, [enabled, question.slug, startSession, stop, speech])

  useEffect(() => {
    if (!paused) return

    stop()
    speech.stop()
    processingRef.current = false
  }, [paused, stop, speech])

  const isBusy = phase === 'starting' || phase === 'thinking' || isSpeaking

  const retryStart = useCallback(() => {
    stop()
    speech.stop()
    void startSession()
  }, [startSession, stop, speech])

  const playIntroduction = useCallback(async () => {
    setError(null)
    setPhase('speaking')
    try {
      await playPending()
      conversationStartedRef.current = true
      setPhase('listening')
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
    isListening: speech.isListening && canListen,
    interimTranscript: speech.interimTranscript,
    speechSupported: speech.isSupported,
    playBlocked,
    retryStart,
    playIntroduction,
    submitMessage,
  }
}

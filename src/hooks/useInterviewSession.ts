import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../data/questions'
import {
  requestInterviewTurn,
  requestSessionOpening,
  type InterviewTurnRequest,
} from '../lib/interviewApi'
import { pickInterviewerName } from '../lib/interviewerSession'
import {
  buildInterviewerContext,
  candidateAskedForHint,
  type PracticeSessionSnapshot,
} from '../prompts/interviewer/sessionSnapshot'
import type { HintLevel, InterviewerTranscriptEntry } from '../prompts/interviewer/types'
import { toInterviewQuestionContext, type InterviewPhase } from '../types/interview'
import { stopAllInterviewAudio, useInterviewerTTS } from './useInterviewerTTS'
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

  const { speak, isSpeaking, playBlocked, playPending } = useInterviewerTTS()

  const getSnapshotRef = useRef(getSnapshot)
  const onTestsJustRunConsumedRef = useRef(onTestsJustRunConsumed)
  const codeAtLastTurnRef = useRef('')
  const sessionStartRef = useRef(Date.now())
  const lastCandidateSpeechRef = useRef(Date.now())
  const processingRef = useRef(false)
  const conversationStartedRef = useRef(false)
  const pausedRef = useRef(paused)
  const transcriptRef = useRef<InterviewerTranscriptEntry[]>([])
  const interviewerNameRef = useRef(pickInterviewerName())
  const speechStopRef = useRef<() => void>(() => undefined)
  const speechResumeRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const sessionRunIdRef = useRef(0)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

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
    setTranscript((current) => {
      const next = [...current, entry]
      transcriptRef.current = next
      return next
    })
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
        interviewerFirstName: interviewerNameRef.current,
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
      if (pausedRef.current) return

      setPhase('speaking')
      await speak(reply)
      if (pausedRef.current) return
      await speechResumeRef.current?.()
      if (pausedRef.current) return
      setPhase('listening')
    },
    [appendTranscript, speak],
  )

  const handleCandidateMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || processingRef.current || pausedRef.current) return

      processingRef.current = true
      lastCandidateSpeechRef.current = Date.now()
      setError(null)
      setPhase('thinking')

      const candidateEntry = appendTranscript('candidate', text)
      const transcriptForTurn = [...transcriptRef.current, candidateEntry]

      try {
        const turn = await requestInterviewTurn(buildTurnRequest(text, transcriptForTurn))
        if (pausedRef.current) return
        await deliverReply(turn.reply, turn.role)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not reach the interviewer.'
        setError(message)
        if (!pausedRef.current) {
          setPhase('listening')
        }
      } finally {
        processingRef.current = false
      }
    },
    [appendTranscript, buildTurnRequest, deliverReply],
  )

  const canListen =
    enabled &&
    !paused &&
    conversationStartedRef.current &&
    phase === 'listening' &&
    !isSpeaking &&
    !processingRef.current

  const speech = useWhisperCapture({
    enabled: canListen,
    deviceId: microphoneDeviceId,
    onUtterance: (text) => {
      void handleCandidateMessage(text)
    },
    onError: (message) => {
      setError(message)
      if (!pausedRef.current) {
        setPhase('listening')
      }
    },
  })

  speechStopRef.current = speech.stop
  speechResumeRef.current = speech.resumeAudioContext

  const startSession = useCallback(async () => {
    const runId = ++sessionRunIdRef.current

    setPhase('starting')
    setError(null)
    setTranscript([])
    transcriptRef.current = []
    setHintLevel(0)
    codeAtLastTurnRef.current = getSnapshotRef.current().code
    sessionStartRef.current = Date.now()
    lastCandidateSpeechRef.current = Date.now()
    conversationStartedRef.current = false
    processingRef.current = false
    interviewerNameRef.current = pickInterviewerName()

    try {
      const openingTurn = await requestSessionOpening(
        questionContext,
        interviewerNameRef.current,
      )
      if (runId !== sessionRunIdRef.current || pausedRef.current) return

      const opening = openingTurn.reply

      setPhase('speaking')
      await speak(opening)
      if (runId !== sessionRunIdRef.current || pausedRef.current) return

      appendTranscript('interviewer', opening)
      await speechResumeRef.current?.()
      if (runId !== sessionRunIdRef.current || pausedRef.current) return

      conversationStartedRef.current = true
      setPhase('listening')
    } catch (err) {
      if (runId !== sessionRunIdRef.current) return

      const message = err instanceof Error ? err.message : 'Could not play the introduction.'
      if (message.includes('Play introduction')) {
        const fallback = await requestSessionOpening(
          questionContext,
          interviewerNameRef.current,
        )
        if (runId !== sessionRunIdRef.current || pausedRef.current) return

        appendTranscript('interviewer', fallback.reply)
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
      sessionRunIdRef.current += 1
      stopAllInterviewAudio()
      speechStopRef.current()
      processingRef.current = false
    }
  }, [enabled, question.slug, startSession])

  useEffect(() => {
    if (!paused) return

    sessionRunIdRef.current += 1
    stopAllInterviewAudio()
    speechStopRef.current()
    processingRef.current = false
  }, [paused])

  const isBusy = phase === 'starting' || phase === 'thinking' || isSpeaking

  const retryStart = useCallback(() => {
    sessionRunIdRef.current += 1
    stopAllInterviewAudio()
    speechStopRef.current()
    void startSession()
  }, [startSession])

  const playIntroduction = useCallback(async () => {
    if (pausedRef.current) return

    setError(null)
    setPhase('speaking')
    try {
      await playPending()
      if (pausedRef.current) return
      await speechResumeRef.current?.()
      if (pausedRef.current) return
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
    speechSupported: speech.isSupported,
    playBlocked,
    retryStart,
    playIntroduction,
  }
}

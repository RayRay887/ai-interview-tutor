import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../data/questions'
import {
  requestInterviewTurn,
  requestSessionOpening,
  type InterviewTurnRequest,
} from '../lib/interviewApi'
import { pickInterviewerName } from '../lib/interviewerSession'
import { assessApproachClarity } from '../prompts/interviewer/assessApproach'
import { buildContextStats, buildInterviewerPayload } from '../prompts/interviewer/buildContext'
import {
  buildInterviewerContext,
  candidateAskedForHint,
  type PracticeSessionSnapshot,
} from '../prompts/interviewer/sessionSnapshot'
import type {
  HintLevel,
  InterviewerQuestionContext,
  InterviewerTranscriptEntry,
} from '../prompts/interviewer/types'
import { toInterviewQuestionContext, type InterviewPhase } from '../types/interview'
import { useInterviewerTTS, stopAllInterviewAudio } from './useInterviewerTTS'
import { useWhisperCapture } from './useWhisperCapture'

interface UseInterviewSessionOptions {
  question: Question
  microphoneDeviceId: string
  enabled?: boolean
  paused?: boolean
  onMicLost?: () => void
  getSnapshot: () => PracticeSessionSnapshot
  onTestsJustRunConsumed?: () => void
  /** When set, skip the spoken introduction and continue from saved transcript. */
  resumeInterview?: {
    transcript: InterviewerTranscriptEntry[]
    hintLevel: HintLevel
  } | null
}

function toTurnMessages(transcript: InterviewerTranscriptEntry[]) {
  return transcript.map(({ role, text }) => ({ role, text }))
}

function payloadToTurnRequest(
  payload: Record<string, unknown>,
  userMessage: string,
  messages: InterviewerTranscriptEntry[],
  fallbackQuestion: ReturnType<typeof toInterviewQuestionContext>,
  interviewerFirstName: string,
): InterviewTurnRequest {
  const pq = payload.question as InterviewerQuestionContext | Record<string, unknown>
  const pc = payload.code as Record<string, unknown> | undefined
  const pt = payload.tests as InterviewTurnRequest['tests']
  const ps = payload.session as InterviewTurnRequest['session']
  const pSignals = payload.signals as InterviewTurnRequest['signals']
  const pHint = payload.hintState as InterviewTurnRequest['hintState']
  const pConsole = payload.console as InterviewTurnRequest['console']

  const question = {
    title: (pq as InterviewerQuestionContext).title ?? fallbackQuestion.title,
    description:
      'description' in pq && typeof pq.description === 'string'
        ? pq.description
        : fallbackQuestion.description,
    difficulty: (pq as InterviewerQuestionContext).difficulty ?? fallbackQuestion.difficulty,
    category: (pq as InterviewerQuestionContext).category ?? fallbackQuestion.category,
    constraints:
      'constraints' in pq ? (pq.constraints as string[] | undefined) : fallbackQuestion.constraints,
  }

  return {
    question,
    messages: toTurnMessages(messages),
    userMessage,
    interviewerFirstName,
    code: pc
      ? {
          source: typeof pc.source === 'string' ? pc.source : undefined,
          changedSinceLastTurn:
            typeof pc.changedSinceLastTurn === 'boolean' ? pc.changedSinceLastTurn : undefined,
          lineCount: typeof pc.lineCount === 'number' ? pc.lineCount : undefined,
        }
      : undefined,
    console: pConsole,
    tests: pt,
    session: ps,
    signals: pSignals,
    hintState: pHint,
  }
}

export function useInterviewSession({
  question,
  microphoneDeviceId,
  enabled = true,
  paused = false,
  onMicLost,
  getSnapshot,
  onTestsJustRunConsumed,
  resumeInterview = null,
}: UseInterviewSessionOptions) {
  const [phase, setPhase] = useState<InterviewPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<InterviewerTranscriptEntry[]>([])
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)

  const {
    speak,
    prefetchSpeech,
    playSpeechBlob,
    stop: stopTTS,
    isSpeaking,
    playBlocked,
    playPending,
  } = useInterviewerTTS()

  const getSnapshotRef = useRef(getSnapshot)
  const onTestsJustRunConsumedRef = useRef(onTestsJustRunConsumed)
  const codeAtLastTurnRef = useRef('')
  const sessionStartRef = useRef(Date.now())
  const lastCandidateSpeechRef = useRef(Date.now())
  const processingRef = useRef(false)
  const approachProbeCountRef = useRef(0)
  const lastSessionPhaseRef = useRef<string>('opening')
  const [conversationStarted, setConversationStarted] = useState(false)
  const pausedRef = useRef(paused)
  const transcriptRef = useRef<InterviewerTranscriptEntry[]>([])
  const interviewerNameRef = useRef(pickInterviewerName())
  const speechStopRef = useRef<() => void>(() => undefined)
  const speechResumeRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const ttsStopRef = useRef<() => void>(() => undefined)
  const sessionRunIdRef = useRef(0)
  const pauseStartedAtRef = useRef<number | null>(null)
  const pendingOpeningRef = useRef<string | null>(null)
  const resumePauseSecondsRef = useRef(0)
  const prevPausedRef = useRef(paused)
  const sessionEndedRef = useRef(false)
  const resumeInterviewRef = useRef(resumeInterview)
  resumeInterviewRef.current = resumeInterview

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
      const approachClarity = assessApproachClarity(userMessage)

      const context = buildInterviewerContext(
        question,
        snapshot,
        transcriptForTurn,
        hintLevel,
        codeAtLastTurnRef.current,
        silenceSeconds,
      )

      context.signals.candidateAskedForHint = candidateAskedForHint(userMessage)
      context.signals.approachClarity = approachClarity
      context.signals.approachProbeCount = approachProbeCountRef.current

      if (context.session.phase === 'approach' && approachClarity === 'concrete') {
        context.session = { ...context.session, phase: 'implementation' }
      }

      if (lastSessionPhaseRef.current !== context.session.phase) {
        if (approachClarity === 'concrete') {
          approachProbeCountRef.current = 0
        }
        lastSessionPhaseRef.current = context.session.phase
      }

      const payload = buildInterviewerPayload(context, { isOpening: false })

      if (import.meta.env.DEV) {
        const stats = buildContextStats(context, { isOpening: false })
        console.debug('[voice-turn] context', stats)
      }

      const pauseSeconds = resumePauseSecondsRef.current
      if (pauseSeconds > 0) {
        context.signals.sessionJustResumedAfterPauseSeconds = pauseSeconds
        resumePauseSecondsRef.current = 0
      }

      codeAtLastTurnRef.current = snapshot.code
      if (snapshot.testsJustRun) {
        onTestsJustRunConsumedRef.current?.()
      }

      return payloadToTurnRequest(
        payload,
        userMessage,
        transcriptForTurn,
        questionContext,
        interviewerNameRef.current,
      )
    },
    [question, questionContext, hintLevel],
  )

  const deliverReply = useCallback(
    async (
      reply: string,
      role: 'interviewer' | 'hint',
      approachClarity?: ReturnType<typeof assessApproachClarity>,
    ) => {
      if (sessionEndedRef.current) return

      appendTranscript(role, reply)
      if (role === 'hint') {
        setHintLevel((current) => Math.min(4, current + 1) as HintLevel)
      }

      if (approachClarity === 'concrete') {
        approachProbeCountRef.current = 0
      } else if (approachClarity === 'partial' && reply.trim().endsWith('?')) {
        approachProbeCountRef.current += 1
      }

      if (pausedRef.current || sessionEndedRef.current) return

      setPhase('speaking')
      const ttsStart = performance.now()
      const blob = await prefetchSpeech(reply)
      const ttsMs = Math.round(performance.now() - ttsStart)
      if (pausedRef.current || sessionEndedRef.current) return
      await playSpeechBlob(blob)
      if (pausedRef.current || sessionEndedRef.current) return
      await speechResumeRef.current?.()
      if (pausedRef.current || sessionEndedRef.current) return
      setPhase('listening')

      if (import.meta.env.DEV) {
        console.debug('[voice-turn] ttsMs', ttsMs)
      }
    },
    [appendTranscript, playSpeechBlob, prefetchSpeech],
  )

  const handleCandidateMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || processingRef.current || pausedRef.current || sessionEndedRef.current) return

      processingRef.current = true
      lastCandidateSpeechRef.current = Date.now()
      setError(null)
      setPhase('thinking')

      const approachClarity = assessApproachClarity(text)
      const candidateEntry = appendTranscript('candidate', text)
      const transcriptForTurn = [...transcriptRef.current, candidateEntry]
      const turnStart = performance.now()

      try {
        const llmStart = performance.now()
        const turn = await requestInterviewTurn(buildTurnRequest(text, transcriptForTurn))
        const llmMs = Math.round(performance.now() - llmStart)
        if (pausedRef.current || sessionEndedRef.current) return
        await deliverReply(turn.reply, turn.role, approachClarity)

        if (import.meta.env.DEV) {
          console.debug('[voice-turn]', {
            llmMs,
            totalMs: Math.round(performance.now() - turnStart),
            approachClarity,
            approachProbeCount: approachProbeCountRef.current,
          })
        }
      } catch (err) {
        if (sessionEndedRef.current) return
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

  const micActive =
    enabled &&
    !paused &&
    !sessionEndedRef.current &&
    conversationStarted &&
    phase !== 'error' &&
    phase !== 'starting' &&
    phase !== 'complete'

  const vadEnabled = micActive && phase === 'listening' && !isSpeaking

  const speech = useWhisperCapture({
    active: micActive,
    vadEnabled,
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
    onMicLost,
  })

  speechStopRef.current = speech.stop
  speechResumeRef.current = speech.resumeAudioContext
  ttsStopRef.current = stopTTS

  const startSession = useCallback(async () => {
    const runId = ++sessionRunIdRef.current

    setPhase('starting')
    setError(null)
    setTranscript([])
    transcriptRef.current = []
    setHintLevel(0)
    approachProbeCountRef.current = 0
    lastSessionPhaseRef.current = 'opening'
    codeAtLastTurnRef.current = getSnapshotRef.current().code
    sessionStartRef.current = Date.now()
    lastCandidateSpeechRef.current = Date.now()
    setConversationStarted(false)
    processingRef.current = false
    sessionEndedRef.current = false
    pendingOpeningRef.current = null
    resumePauseSecondsRef.current = 0
    pauseStartedAtRef.current = null
    interviewerNameRef.current = pickInterviewerName()

    try {
      const openingTurn = await requestSessionOpening(
        questionContext,
        interviewerNameRef.current,
      )
      const opening = openingTurn.reply
      pendingOpeningRef.current = opening

      if (runId !== sessionRunIdRef.current || pausedRef.current || sessionEndedRef.current) return

      setPhase('speaking')
      await speak(opening)
      if (runId !== sessionRunIdRef.current || pausedRef.current || sessionEndedRef.current) return

      appendTranscript('interviewer', opening)
      pendingOpeningRef.current = null
      await speechResumeRef.current?.()
      if (runId !== sessionRunIdRef.current || pausedRef.current || sessionEndedRef.current) return

      setConversationStarted(true)
      lastSessionPhaseRef.current = 'approach'
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
        pendingOpeningRef.current = null
        setConversationStarted(true)
        lastSessionPhaseRef.current = 'approach'
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

    const saved = resumeInterviewRef.current
    if (saved) {
      sessionEndedRef.current = false
      processingRef.current = false
      setError(null)
      if (saved.transcript.length > 0) {
        setTranscript(saved.transcript)
        transcriptRef.current = saved.transcript
        setHintLevel(saved.hintLevel)
      }
      setConversationStarted(true)
      lastSessionPhaseRef.current =
        saved.transcript.length > 0 ? 'implementation' : 'approach'
      codeAtLastTurnRef.current = getSnapshotRef.current().code
      sessionStartRef.current = Date.now()
      lastCandidateSpeechRef.current = Date.now()
      setPhase('listening')
      return () => {
        sessionRunIdRef.current += 1
        ttsStopRef.current()
        speechStopRef.current()
        processingRef.current = false
      }
    }

    void startSession()

    return () => {
      sessionRunIdRef.current += 1
      ttsStopRef.current()
      speechStopRef.current()
      processingRef.current = false
    }
  }, [enabled, question.slug, startSession])

  useEffect(() => {
    const wasPaused = prevPausedRef.current
    prevPausedRef.current = paused

    if (paused) {
      pauseStartedAtRef.current = Date.now()
      sessionRunIdRef.current += 1
      ttsStopRef.current()
      speechStopRef.current()
      processingRef.current = false
      return
    }

    if (!wasPaused) return

    if (pauseStartedAtRef.current !== null) {
      resumePauseSecondsRef.current = Math.round(
        (Date.now() - pauseStartedAtRef.current) / 1000,
      )
      pauseStartedAtRef.current = null
    }

    let resumedConversation = false

    if (transcriptRef.current.length > 0) {
      setConversationStarted(true)
      resumedConversation = true
    } else if (pendingOpeningRef.current) {
      appendTranscript('interviewer', pendingOpeningRef.current)
      pendingOpeningRef.current = null
      setConversationStarted(true)
      resumedConversation = true
    }

    if (resumedConversation) {
      processingRef.current = false
      setPhase((current) => (current === 'error' ? current : 'listening'))
    }
  }, [paused, appendTranscript])

  const isBusy = phase === 'starting' || phase === 'thinking' || isSpeaking

  const retryStart = useCallback(() => {
    sessionRunIdRef.current += 1
    sessionEndedRef.current = false
    ttsStopRef.current()
    speechStopRef.current()
    pendingOpeningRef.current = null
    resumePauseSecondsRef.current = 0
    pauseStartedAtRef.current = null
    void startSession()
  }, [startSession])

  const playIntroduction = useCallback(async () => {
    if (pausedRef.current || sessionEndedRef.current) return

    setError(null)
    setPhase('speaking')
    try {
      await playPending()
      if (pausedRef.current || sessionEndedRef.current) return
      await speechResumeRef.current?.()
      if (pausedRef.current || sessionEndedRef.current) return
      setConversationStarted(true)
      lastSessionPhaseRef.current = 'approach'
      setPhase('listening')
    } catch (err) {
      if (sessionEndedRef.current) return
      setError(err instanceof Error ? err.message : 'Could not play audio.')
      setPhase('error')
    }
  }, [playPending])

  const endSession = useCallback(() => {
    sessionEndedRef.current = true
    sessionRunIdRef.current += 1
    stopAllInterviewAudio()
    ttsStopRef.current()
    speechStopRef.current()
    processingRef.current = false
    pendingOpeningRef.current = null
    setPhase('complete')
  }, [])

  return {
    phase,
    error,
    isSpeaking,
    isBusy,
    isListening: speech.isListening && vadEnabled,
    speechSupported: speech.isSupported,
    playBlocked,
    transcript,
    hintLevel,
    retryStart,
    playIntroduction,
    endSession,
  }
}

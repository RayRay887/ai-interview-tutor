import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Loader2,
  MicOff,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  codeLanguages,
  getLanguageExtension,
  getStarterCode,
  type CodeLanguage,
} from '../../data/languages'
import type { Question } from '../../data/questions'
import { isMicrophoneAvailable, useMicrophoneMonitor } from '../../hooks/useMicrophoneMonitor'
import { stopAllInterviewAudio } from '../../hooks/useInterviewerTTS'
import {
  runHiddenQuestionTests,
  runQuestionTests,
  type ConsoleEntry,
  type TestCase,
  type TestResult,
} from '../../lib/codeRunner'
import {
  formatCountdown,
  minutesToSeconds,
} from '../../lib/questionDuration'
import { usePracticeAttempt } from '../../context/PracticeAttemptContext'
import {
  autosavePracticeAttempt,
  finalizePracticeAttempt,
  getPracticeAttempt,
  type FinalizeAttemptSnapshot,
  type PracticeAttemptRow,
} from '../../lib/practiceAttempts'
import {
  clearAttemptLocalState,
  clearQuestionDraft,
  markRestartRequested,
  readAttemptLocalState,
  readQuestionDraft,
  writeAttemptLocalState,
  writeQuestionDraft,
  type QuestionPracticeDraft,
} from '../../lib/practiceSessionStorage'
import { CodeEditor } from './CodeEditor'
import { CollapsibleSection } from './CollapsibleSection'
import { ConsolePanel } from './ConsolePanel'
import { InterviewerPanel } from './InterviewerPanel'
import { useInterviewSession } from '../../hooks/useInterviewSession'
import type { HintLevel, InterviewerTranscriptEntry } from '../../prompts/interviewer/types'

import {
  buildLastFailures,
  type PracticeSessionSnapshot,
} from '../../prompts/interviewer/sessionSnapshot'

interface PracticeSessionProps {
  attemptId: string
  question: Question
  microphoneDeviceId: string
  sessionMinutes: number
  userTestMode: boolean
  restoredAttempt?: PracticeAttemptRow | null
  onRestart?: () => void
}

interface CustomTestCase {
  id: string
  input: string
  output: string
}

type PauseReason = 'manual' | 'microphone' | 'time-up'

function createIdleResults(count: number): TestResult[] {
  return Array.from({ length: count }, () => ({ status: 'idle' }))
}

function transcriptFromAttempt(
  transcript: PracticeAttemptRow['transcript'],
): InterviewerTranscriptEntry[] {
  return transcript.map((entry, index) => ({
    role: entry.role as InterviewerTranscriptEntry['role'],
    text: entry.text,
    timestamp: index * 1000,
  }))
}

function buildInitialSessionState(
  question: Question,
  sessionMinutes: number,
  attemptId: string,
  userId: string,
  restoredAttempt: PracticeAttemptRow | null | undefined,
) {
  const slugDraft = readQuestionDraft(userId, question.slug)
  const local = readAttemptLocalState(attemptId)
  const language = (slugDraft?.language ??
    restoredAttempt?.language ??
    'python') as CodeLanguage

  const codeByLanguage: Partial<Record<CodeLanguage, string>> = {
    python: question.starterCode,
    ...(local?.codeByLanguage ?? {}),
  }

  if (restoredAttempt?.code) {
    codeByLanguage[language] = restoredAttempt.code
  }

  if (slugDraft?.codeByLanguage) {
    for (const [lang, source] of Object.entries(slugDraft.codeByLanguage)) {
      if (typeof source === 'string' && source.trim()) {
        codeByLanguage[lang as CodeLanguage] = source
      }
    }
  }

  const plannedSeconds = minutesToSeconds(sessionMinutes)
  let remainingSeconds = plannedSeconds
  if (slugDraft?.remainingSeconds != null && slugDraft.remainingSeconds > 0) {
    remainingSeconds = Math.min(plannedSeconds, slugDraft.remainingSeconds)
  } else if (restoredAttempt?.duration_seconds != null) {
    remainingSeconds = Math.max(0, plannedSeconds - restoredAttempt.duration_seconds)
  }

  const customTestCases =
    slugDraft?.customTestCases?.length ? slugDraft.customTestCases : (local?.customTestCases ?? [])

  const resumeInterview =
    restoredAttempt && restoredAttempt.transcript.length > 0
      ? {
          transcript: transcriptFromAttempt(restoredAttempt.transcript),
          hintLevel: Math.min(4, restoredAttempt.hints_used) as HintLevel,
        }
      : null

  return {
    language,
    codeByLanguage,
    remainingSeconds,
    customTestCases,
    resumeInterview,
  }
}

function persistQuestionDraft(
  userId: string,
  draft: Omit<QuestionPracticeDraft, 'updatedAt'>,
) {
  writeQuestionDraft(userId, { ...draft, updatedAt: Date.now() })
}

function TestFailureDetails({ result }: { result: TestResult }) {
  if (result.status !== 'failed') return null

  if (result.expected != null && result.actual != null) {
    return (
      <div className="mt-2 space-y-1 rounded border border-rose-500/20 bg-rose-500/5 p-2 font-mono text-[10px]">
        <p>
          <span className="text-text-secondary">Expected value: </span>
          <span className="text-emerald-400/90">{result.expected}</span>
        </p>
        <p>
          <span className="text-text-secondary">Actual value: </span>
          <span className="text-rose-400/90">{result.actual}</span>
        </p>
      </div>
    )
  }

  if (result.error) {
    return <p className="mt-1 font-mono text-[10px] text-rose-400/90">{result.error}</p>
  }

  if (result.actual) {
    return (
      <p className="mt-1 font-mono text-[10px] text-rose-400/90">
        Actual value: {result.actual}
      </p>
    )
  }

  return null
}

export function PracticeSession({
  attemptId,
  question,
  microphoneDeviceId,
  sessionMinutes,
  userTestMode,
  restoredAttempt = null,
  onRestart,
}: PracticeSessionProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { registerAbandonHandler, registerSaveHandler, setLeaveProtectionEnabled } =
    usePracticeAttempt()
  const exitIntentRef = useRef<'active' | 'submitting' | 'completed' | 'abandoned'>('active')

  const [initialState] = useState(() =>
    user
      ? buildInitialSessionState(
          question,
          sessionMinutes,
          attemptId,
          user.id,
          restoredAttempt,
        )
      : {
          language: 'python' as CodeLanguage,
          codeByLanguage: { python: question.starterCode },
          remainingSeconds: minutesToSeconds(sessionMinutes),
          customTestCases: [] as CustomTestCase[],
          resumeInterview: null,
        },
  )
  const resumeInterviewRef = useRef(initialState.resumeInterview)

  const [language, setLanguage] = useState<CodeLanguage>(initialState.language)
  const [codeByLanguage, setCodeByLanguage] = useState<
    Partial<Record<CodeLanguage, string>>
  >(initialState.codeByLanguage)
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>(
    initialState.customTestCases,
  )
  const [remainingSeconds, setRemainingSeconds] = useState(initialState.remainingSeconds)
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>(() =>
    createIdleResults(question.examples.length),
  )
  const hiddenTestCount = userTestMode ? 0 : (question.hiddenTests?.length ?? 0)
  const [hiddenTestResults, setHiddenTestResults] = useState<TestResult[]>(() =>
    hiddenTestCount > 0 ? createIdleResults(hiddenTestCount) : [],
  )
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const testsJustRunRef = useRef(false)

  useEffect(() => {
    setLeaveProtectionEnabled(true)
    return () => setLeaveProtectionEnabled(false)
  }, [setLeaveProtectionEnabled])

  const isPaused = pauseReason !== null
  const isDialogOpen = submitConfirmOpen || restartConfirmOpen
  const isSessionHeld = isPaused || isDialogOpen || isSubmitting || isRestarting
  const isTimerRunning = !isSessionHeld && remainingSeconds > 0

  const code = codeByLanguage[language] ?? getStarterCode(question, language)

  const persistDraft = useCallback(
    (
      overrides: Partial<{
        codeByLanguage: Partial<Record<CodeLanguage, string>>
        language: CodeLanguage
        remainingSeconds: number
        customTestCases: CustomTestCase[]
      }> = {},
    ) => {
      if (!user) return
      const activeLanguage = overrides.language ?? language
      const nextCodeByLanguage = overrides.codeByLanguage ?? {
        ...codeByLanguage,
        [activeLanguage]: overrides.codeByLanguage?.[activeLanguage] ?? code,
      }
      persistQuestionDraft(user.id, {
        attemptId,
        questionSlug: question.slug,
        sessionMinutes,
        userTestMode,
        language: activeLanguage,
        codeByLanguage: nextCodeByLanguage,
        remainingSeconds: overrides.remainingSeconds ?? remainingSeconds,
        customTestCases: overrides.customTestCases ?? customTestCases,
      })
    },
    [
      user,
      attemptId,
      question.slug,
      sessionMinutes,
      userTestMode,
      language,
      codeByLanguage,
      code,
      remainingSeconds,
      customTestCases,
    ],
  )

  const persistDraftRef = useRef(persistDraft)
  persistDraftRef.current = persistDraft

  const fileName = `${question.slug}.${getLanguageExtension(language)}`
  const inputPlaceholder = question.examples[0]?.input ?? 'nums = [1, 2], target = 3'
  const outputPlaceholder = question.examples[0]?.output ?? '[0, 1]'

  const visibleTestCases = useMemo<TestCase[]>(() => {
    if (userTestMode) {
      return [
        ...question.examples,
        ...customTestCases.map(({ input, output }) => ({ input, output })),
      ]
    }
    return question.examples
  }, [question.examples, customTestCases, userTestMode])

  const totalCount = visibleTestCases.length + hiddenTestResults.length
  const hiddenPassedCount = hiddenTestResults.filter((result) => result.status === 'passed').length

  const getSnapshot = useCallback((): PracticeSessionSnapshot => {
    const passed =
      testResults.filter((result) => result.status === 'passed').length + hiddenPassedCount
    return {
      code,
      language,
      consoleEntries,
      passedCount: passed,
      totalCount,
      lastFailures: buildLastFailures(testResults, visibleTestCases),
      hiddenPassed: hiddenTestResults.length > 0 ? hiddenPassedCount : undefined,
      hiddenTotal: hiddenTestResults.length > 0 ? hiddenTestResults.length : undefined,
      remainingSeconds,
      sessionMinutes,
      testsJustRun: testsJustRunRef.current,
    }
  }, [
    code,
    language,
    consoleEntries,
    testResults,
    visibleTestCases,
    hiddenPassedCount,
    hiddenTestResults.length,
    totalCount,
    remainingSeconds,
    sessionMinutes,
  ])

  const handleMicLost = useCallback(() => {
    setPauseReason((current) => (current === 'microphone' ? current : 'microphone'))
  }, [])

  const silenceInterviewer = useCallback(() => {
    stopAllInterviewAudio()
  }, [])

  const interview = useInterviewSession({
    question,
    microphoneDeviceId,
    enabled:
      Boolean(microphoneDeviceId) &&
      pauseReason !== 'microphone' &&
      !isSubmitting &&
      !isRestarting,
    paused: isSessionHeld,
    onMicLost: handleMicLost,
    getSnapshot,
    onTestsJustRunConsumed: () => {
      testsJustRunRef.current = false
    },
    resumeInterview: resumeInterviewRef.current,
  })

  const interviewRef = useRef(interview)
  interviewRef.current = interview

  useMicrophoneMonitor({
    deviceId: microphoneDeviceId,
    enabled: Boolean(microphoneDeviceId) && pauseReason !== 'microphone',
    onMicLost: handleMicLost,
  })

  useEffect(() => {
    if (pauseReason !== 'microphone' || !microphoneDeviceId) return

    const checkMic = async () => {
      if (await isMicrophoneAvailable(microphoneDeviceId)) {
        setPauseReason(null)
      }
    }

    void checkMic()
    const id = window.setInterval(() => void checkMic(), 2000)
    return () => window.clearInterval(id)
  }, [pauseReason, microphoneDeviceId])

  const resetTestResults = () => {
    setTestResults(createIdleResults(visibleTestCases.length))
    setHiddenTestResults(
      hiddenTestCount > 0 ? createIdleResults(hiddenTestCount) : [],
    )
  }

  const handleLanguageChange = (nextLanguage: CodeLanguage) => {
    if (isPaused) return
    const nextCodeByLanguage = { ...codeByLanguage, [language]: code }
    setCodeByLanguage(nextCodeByLanguage)
    setLanguage(nextLanguage)
    setConsoleEntries([])
    resetTestResults()
    persistDraft({ codeByLanguage: nextCodeByLanguage, language: nextLanguage })
  }

  const handleCodeChange = (value: string) => {
    if (isPaused) return
    const nextCodeByLanguage = { ...codeByLanguage, [language]: value }
    setCodeByLanguage(nextCodeByLanguage)
    persistDraft({ codeByLanguage: nextCodeByLanguage })
  }

  const handleAddCustomTestCase = () => {
    if (isPaused) return
    setCustomTestCases((current) => [
      ...current,
      { id: crypto.randomUUID(), input: '', output: '' },
    ])
    setTestResults((current) => [...current, { status: 'idle' }])
  }

  const handleRemoveCustomTestCase = (id: string) => {
    if (isPaused) return
    const customIndex = customTestCases.findIndex((testCase) => testCase.id === id)
    if (customIndex === -1) return

    setCustomTestCases((current) => current.filter((testCase) => testCase.id !== id))
    setTestResults((current) =>
      current.filter((_, index) => index !== question.examples.length + customIndex),
    )
  }

  const handleCustomTestCaseChange = (
    id: string,
    field: 'input' | 'output',
    value: string,
  ) => {
    if (isPaused) return
    setCustomTestCases((current) =>
      current.map((testCase) =>
        testCase.id === id ? { ...testCase, [field]: value } : testCase,
      ),
    )
  }

  const handleRunTests = async () => {
    if (isPaused) return
    setIsRunningTests(true)
    setConsoleEntries([])
    setTestResults(visibleTestCases.map(() => ({ status: 'running' })))
    if (hiddenTestCount > 0) {
      setHiddenTestResults(createIdleResults(hiddenTestCount))
    }

    try {
      const result = await runQuestionTests(question, code, language, visibleTestCases)
      setConsoleEntries(result.consoleEntries)
      setTestResults(result.testResults)
      testsJustRunRef.current = true

      const examplesPassed =
        result.testResults.slice(0, question.examples.length).every((r) => r.status === 'passed')

      if (
        !userTestMode &&
        examplesPassed &&
        question.hiddenTests &&
        question.hiddenTests.length > 0
      ) {
        setHiddenTestResults(question.hiddenTests.map(() => ({ status: 'running' })))
        const hidden = await runHiddenQuestionTests(
          question,
          code,
          language,
          question.hiddenTests,
        )
        setHiddenTestResults(hidden.testResults)
        setConsoleEntries((current) => [...current, ...hidden.consoleEntries])
      }
    } catch (error) {
      setConsoleEntries([
        {
          id: 'runtime-error',
          level: 'error',
          message: error instanceof Error ? error.message : 'Unexpected error while running tests.',
          source: 'runtime',
        },
      ])
      setTestResults(visibleTestCases.map(() => ({ status: 'failed' })))
    } finally {
      setIsRunningTests(false)
    }
  }

  const handlePause = () => {
    setPauseReason('manual')
  }

  const handleResume = async () => {
    if (pauseReason === 'microphone') {
      if (!(await isMicrophoneAvailable(microphoneDeviceId))) {
        return
      }
    }

    setPauseReason(null)
  }

  const visiblePassedCount = testResults.filter((result) => result.status === 'passed').length
  const passedCount = visiblePassedCount + hiddenPassedCount
  const hasRunVisibleTests = testResults.some((result) => result.status !== 'idle')
  const hasRunHiddenTests = hiddenTestResults.some((result) => result.status !== 'idle')
  const hasRunTests = hasRunVisibleTests || hasRunHiddenTests
  const allVisiblePassed =
    hasRunVisibleTests &&
    testResults.length > 0 &&
    testResults.every((result) => result.status === 'passed')
  const hasHiddenTests = hiddenTestResults.length > 0
  const allHiddenPassed =
    !hasHiddenTests ||
    (hasRunHiddenTests && hiddenTestResults.every((result) => result.status === 'passed'))
  const allPassed = allVisiblePassed && allHiddenPassed

  const buildFinalizeSnapshot = useCallback((): FinalizeAttemptSnapshot => {
    return {
      code,
      language,
      testsPassed: passedCount,
      testsTotal: totalCount,
      allTestsPassed: allPassed,
      hiddenPassed: hiddenTestResults.length > 0 ? hiddenPassedCount : undefined,
      hiddenTotal: hiddenTestResults.length > 0 ? hiddenTestResults.length : undefined,
      hintsUsed: interview.hintLevel,
      transcript: interview.transcript.map(({ role, text }) => ({ role, text })),
      remainingSeconds,
      sessionMinutesPlanned: sessionMinutes,
    }
  }, [
    code,
    language,
    passedCount,
    totalCount,
    allPassed,
    hiddenTestResults.length,
    hiddenPassedCount,
    interview.hintLevel,
    interview.transcript,
    remainingSeconds,
    sessionMinutes,
  ])

  const buildFinalizeSnapshotRef = useRef(buildFinalizeSnapshot)
  buildFinalizeSnapshotRef.current = buildFinalizeSnapshot

  const finalizeAbandoned = useCallback(async () => {
    if (!user) return
    if (exitIntentRef.current === 'submitting' || exitIntentRef.current === 'completed') return
    if (exitIntentRef.current === 'abandoned') return

    exitIntentRef.current = 'abandoned'
    interviewRef.current.endSession()
    clearAttemptLocalState(attemptId)
    if (user) clearQuestionDraft(user.id, question.slug)
    try {
      await finalizePracticeAttempt(
        attemptId,
        user.id,
        'abandoned',
        buildFinalizeSnapshotRef.current(),
      )
    } catch (err) {
      exitIntentRef.current = 'active'
      console.error('Failed to finalize abandoned session:', err)
    }
  }, [attemptId, user, question.slug])

  const saveProgress = useCallback(async () => {
    if (!user) return
    interviewRef.current.endSession()
    stopAllInterviewAudio()
    persistDraft()
    writeAttemptLocalState(attemptId, {
      userTestMode,
      customTestCases,
      codeByLanguage: { ...codeByLanguage, [language]: code },
    })
    await autosavePracticeAttempt(
      attemptId,
      user.id,
      buildFinalizeSnapshotRef.current(),
    )
  }, [
    attemptId,
    user,
    userTestMode,
    customTestCases,
    codeByLanguage,
    language,
    code,
    persistDraft,
  ])

  const saveProgressRef = useRef(saveProgress)
  saveProgressRef.current = saveProgress

  useEffect(() => {
    registerAbandonHandler(finalizeAbandoned)
    return () => registerAbandonHandler(null)
  }, [registerAbandonHandler, finalizeAbandoned])

  useEffect(() => {
    registerSaveHandler(() => saveProgressRef.current())
    return () => registerSaveHandler(null)
  }, [registerSaveHandler])

  useEffect(() => {
    if (!user) return

    persistDraftRef.current()

    const timeout = window.setTimeout(() => {
      void autosavePracticeAttempt(
        attemptId,
        user.id,
        buildFinalizeSnapshotRef.current(),
      ).catch((err) => {
        console.error('Autosave failed:', err)
      })
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [
    attemptId,
    user,
    code,
    language,
    codeByLanguage,
    customTestCases,
    userTestMode,
    passedCount,
    totalCount,
    allPassed,
    hiddenPassedCount,
    hiddenTestResults.length,
    interview.hintLevel,
    interview.transcript,
    remainingSeconds,
  ])

  useEffect(() => {
    if (!user) return

    const interval = window.setInterval(() => {
      void autosavePracticeAttempt(
        attemptId,
        user.id,
        buildFinalizeSnapshotRef.current(),
      ).catch((err) => {
        console.error('Periodic autosave failed:', err)
      })
    }, 30_000)

    const handlePageHide = () => {
      persistDraftRef.current()
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [attemptId, user, userTestMode, customTestCases])

  useEffect(() => {
    if (!isTimerRunning) return
    const id = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          setPauseReason((reason) => reason ?? 'time-up')
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [isTimerRunning])

  useEffect(() => {
    if (!submitConfirmOpen && !restartConfirmOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isSubmitting) setSubmitConfirmOpen(false)
        if (!isRestarting) setRestartConfirmOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [submitConfirmOpen, restartConfirmOpen, isSubmitting, isRestarting])

  const handleSubmitFeedback = useCallback(async () => {
    if (!user || isSubmitting) return
    if (exitIntentRef.current === 'completed') return

    exitIntentRef.current = 'submitting'
    setLeaveProtectionEnabled(false)
    setIsSubmitting(true)
    setSubmitError(null)
    silenceInterviewer()
    interviewRef.current.endSession()

    try {
      persistDraft()
      writeAttemptLocalState(attemptId, {
        userTestMode,
        customTestCases,
        codeByLanguage: { ...codeByLanguage, [language]: code },
      })

      await autosavePracticeAttempt(
        attemptId,
        user.id,
        buildFinalizeSnapshotRef.current(),
      )

      const existing = await getPracticeAttempt(attemptId, user.id)
      if (!existing) {
        throw new Error('Session not found. Use Restart to begin a fresh attempt.')
      }

      const row = await finalizePracticeAttempt(
        attemptId,
        user.id,
        'completed',
        buildFinalizeSnapshotRef.current(),
      )
      if (row.status !== 'completed') {
        throw new Error('Session could not be marked as submitted. Please try again.')
      }
      exitIntentRef.current = 'completed'
      clearQuestionDraft(user.id, question.slug)
      clearAttemptLocalState(attemptId)

      flushSync(() => {
        setLeaveProtectionEnabled(false)
        setSubmitConfirmOpen(false)
      })
      navigate(`/feedback/attempt/${attemptId}`, { replace: true })
    } catch (err) {
      exitIntentRef.current = 'active'
      setLeaveProtectionEnabled(true)
      const message =
        err instanceof Error ? err.message : 'Could not submit session. Please try again.'
      setSubmitError(message)
      console.error('Failed to submit session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    user,
    isSubmitting,
    attemptId,
    question.slug,
    navigate,
    setLeaveProtectionEnabled,
    persistDraft,
    userTestMode,
    customTestCases,
    codeByLanguage,
    language,
    code,
    silenceInterviewer,
  ])

  const handleConfirmSubmit = () => {
    void handleSubmitFeedback()
  }

  const openRestartConfirm = useCallback(() => {
    if (isSubmitting || isRestarting) return
    silenceInterviewer()
    setRestartConfirmOpen(true)
  }, [isSubmitting, isRestarting, silenceInterviewer])

  const openSubmitConfirm = useCallback(() => {
    if (isSubmitting || isRestarting) return
    silenceInterviewer()
    setSubmitError(null)
    setSubmitConfirmOpen(true)
  }, [isSubmitting, isRestarting, silenceInterviewer])

  const handleRestartQuestion = useCallback(async () => {
    if (!user || isRestarting || isSubmitting) return

    setIsRestarting(true)
    setLeaveProtectionEnabled(false)
    silenceInterviewer()
    interviewRef.current.endSession()
    markRestartRequested(user.id, question.slug)

    try {
      if (exitIntentRef.current !== 'completed' && exitIntentRef.current !== 'submitting') {
        exitIntentRef.current = 'abandoned'
        await finalizePracticeAttempt(
          attemptId,
          user.id,
          'abandoned',
          buildFinalizeSnapshotRef.current(),
        )
      }
      clearQuestionDraft(user.id, question.slug)
      clearAttemptLocalState(attemptId)
      setRestartConfirmOpen(false)
      onRestart?.()
    } catch (err) {
      exitIntentRef.current = 'active'
      console.error('Failed to restart session:', err)
      setSubmitError(
        err instanceof Error ? err.message : 'Could not restart. Please try again.',
      )
      setIsRestarting(false)
    }
  }, [
    user,
    isRestarting,
    isSubmitting,
    attemptId,
    question.slug,
    setLeaveProtectionEnabled,
    silenceInterviewer,
    onRestart,
  ])

  useEffect(() => {
    if (!user) return
    persistDraftRef.current()
  }, [user])

  const renderTestStatus = (status: TestResult['status']) => {
    if (status === 'passed') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    }
    if (status === 'running') {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-blue" />
    }
    if (status === 'failed') {
      return <XCircle className="h-3.5 w-3.5 text-rose-400" />
    }
    return <AlertCircle className="h-3.5 w-3.5 text-text-secondary/50" />
  }

  const pauseMessage =
    pauseReason === 'microphone'
      ? 'Microphone has been turned off or disabled. Re-enable your microphone to continue.'
      : pauseReason === 'time-up'
        ? "Time's up! Resume to keep practicing without the timer."
        : 'Session paused. Resume when you are ready to continue.'

  return (
    <div className="glass glow-blue relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text-primary">{question.title}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              question.difficulty === 'Easy'
                ? 'bg-emerald-500/15 text-emerald-400'
                : question.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {question.difficulty}
          </span>
          <span className="hidden text-xs text-text-secondary sm:inline">{question.category}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Clock className="h-3.5 w-3.5" />
            <span>{sessionMinutes} min</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-sm">
            {isTimerRunning && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            )}
            <span className={remainingSeconds <= 60 ? 'text-rose-400' : 'text-rose-300'}>
              {formatCountdown(remainingSeconds)}
            </span>
          </div>

          {isPaused ? (
            <button
              type="button"
              onClick={() => void handleResume()}
              className="flex items-center gap-1.5 rounded-lg bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/30"
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10"
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={openRestartConfirm}
            disabled={isSubmitting || isRestarting}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            type="button"
            onClick={openSubmitConfirm}
            disabled={isSubmitting || isRestarting}
            className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Submit
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className={`grid h-full min-h-0 lg:grid-cols-[minmax(240px,24%)_minmax(0,1fr)_minmax(280px,380px)] ${
            isPaused ? 'pointer-events-none select-none' : ''
          }`}
          aria-hidden={isPaused}
        >
          <div className="flex min-h-0 flex-col border-b border-white/10 lg:border-r lg:border-b-0">
            <div className="border-b border-white/10 bg-bg-secondary/40 px-5 py-3">
              <h2 className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
                Problem
              </h2>
            </div>

            <div className="theme-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">Description</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{question.description}</p>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">Examples</h3>
                <div className="space-y-4">
                  {question.examples.map((example, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 bg-bg-primary/60 p-4"
                    >
                      <p className="mb-2 text-xs font-medium text-accent-blue">
                        Example {index + 1}
                      </p>
                      <div className="space-y-2 font-mono text-xs">
                        <div>
                          <span className="text-text-secondary">Input: </span>
                          <span className="text-text-primary">{example.input}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Output: </span>
                          <span className="text-emerald-400">{example.output}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {question.constraints && question.constraints.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-text-primary">Constraints</h3>
                  <ul className="space-y-2 rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                    {question.constraints.map((constraint, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm leading-relaxed text-text-secondary"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-blue" />
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col bg-bg-secondary/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-accent-blue" />
                <span className="font-mono text-xs text-text-primary">{fileName}</span>
              </div>

              <div className="relative">
                <label htmlFor="language-select" className="sr-only">
                  Programming language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(event) => handleLanguageChange(event.target.value as CodeLanguage)}
                  disabled={isPaused}
                  className="appearance-none rounded-lg border border-white/10 bg-bg-primary/80 py-2 pr-9 pl-3 text-xs text-text-primary outline-none transition-colors hover:border-accent-blue/40 focus:border-accent-blue/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {codeLanguages.map((option) => (
                    <option key={option.id} value={option.id} className="bg-bg-secondary">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                language={language}
                onChange={handleCodeChange}
                readOnly={isPaused}
              />
            </div>

            <ConsolePanel entries={consoleEntries} />

            <CollapsibleSection
              title="Test Cases"
              badge={
                hasRunTests && !isRunningTests ? (
                  <span
                    className={`text-[10px] font-medium normal-case ${
                      allPassed
                        ? 'text-emerald-400'
                        : passedCount === 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {passedCount}/{totalCount} passed
                  </span>
                ) : isRunningTests ? (
                  <span className="text-[10px] font-medium text-accent-blue normal-case">
                    Running...
                  </span>
                ) : null
              }
              action={
                <button
                  type="button"
                  onClick={handleRunTests}
                  disabled={isRunningTests || isPaused}
                  className="shrink-0 rounded-lg bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunningTests ? 'Running...' : 'Run tests'}
                </button>
              }
              contentClassName="theme-scrollbar h-40 overflow-y-auto p-4 pt-0"
            >
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.examples.map((example, index) => {
                    const result = testResults[index]
                    const status = result?.status ?? 'idle'

                    return (
                      <div
                        key={`builtin-${index}`}
                        className="rounded-lg border border-white/10 bg-bg-primary/60 p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          {renderTestStatus(status)}
                          <span className="text-xs font-medium text-text-primary">
                            Case {index + 1}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-text-secondary">
                          {example.input}
                        </p>
                        <p className="font-mono text-[10px] text-emerald-400/90">
                          → {example.output}
                        </p>
                        {result && <TestFailureDetails result={result} />}
                      </div>
                    )
                  })}
                </div>

                {userTestMode && customTestCases.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium tracking-wider text-text-secondary uppercase">
                      Custom
                    </p>
                    <div className="space-y-2">
                      {customTestCases.map((testCase, index) => {
                        const resultIndex = question.examples.length + index
                        const result = testResults[resultIndex]
                        const status = result?.status ?? 'idle'

                        return (
                          <div
                            key={testCase.id}
                            className="rounded-lg border border-accent-blue/20 bg-bg-primary/60 p-2.5"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {renderTestStatus(status)}
                                <span className="text-xs font-medium text-text-primary">
                                  Custom {index + 1}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomTestCase(testCase.id)}
                                disabled={isPaused}
                                className="rounded p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-rose-400 disabled:opacity-50"
                                aria-label={`Remove custom test case ${index + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <label className="mb-1 block text-[10px] text-text-secondary">
                              Input
                            </label>
                            <input
                              type="text"
                              value={testCase.input}
                              onChange={(event) =>
                                handleCustomTestCaseChange(testCase.id, 'input', event.target.value)
                              }
                              disabled={isPaused}
                              placeholder={inputPlaceholder}
                              className="mb-2 w-full rounded border border-white/10 bg-bg-secondary/60 px-2 py-1.5 font-mono text-[10px] text-text-primary outline-none focus:border-accent-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <label className="mb-1 block text-[10px] text-text-secondary">
                              Expected output
                            </label>
                            <input
                              type="text"
                              value={testCase.output}
                              onChange={(event) =>
                                handleCustomTestCaseChange(
                                  testCase.id,
                                  'output',
                                  event.target.value,
                                )
                              }
                              disabled={isPaused}
                              placeholder={outputPlaceholder}
                              className="w-full rounded border border-white/10 bg-bg-secondary/60 px-2 py-1.5 font-mono text-[10px] text-text-primary outline-none focus:border-accent-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            {result && <TestFailureDetails result={result} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {userTestMode && (
                <button
                  type="button"
                  onClick={handleAddCustomTestCase}
                  disabled={isPaused}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-2 text-xs text-text-secondary transition-colors hover:border-accent-blue/30 hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add test case
                </button>
                )}

                {!userTestMode && hiddenTestResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium tracking-wider text-text-secondary uppercase">
                      Hidden
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {hiddenTestResults.map((result, index) => (
                        <div
                          key={`hidden-${index}`}
                          className="rounded-lg border border-white/10 bg-bg-primary/60 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            {renderTestStatus(result.status)}
                            <span className="text-xs font-medium text-text-primary">
                              Hidden test case #{index + 1}
                            </span>
                          </div>
                          <TestFailureDetails result={result} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          <InterviewerPanel
            phase={interview.phase}
            error={interview.error}
            isSpeaking={interview.isSpeaking}
            paused={isPaused}
            isListening={interview.isListening}
            speechSupported={interview.speechSupported}
            showPlayButton={interview.playBlocked}
            onRetry={() => void interview.retryStart()}
            onPlayIntroduction={() => void interview.playIntroduction()}
          />
        </div>

        {isPaused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-primary/75 p-6 backdrop-blur-sm">
            <div className="glass max-w-md rounded-2xl border border-white/10 p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15">
                {pauseReason === 'microphone' ? (
                  <MicOff className="h-6 w-6 text-rose-400" />
                ) : (
                  <Pause className="h-6 w-6 text-amber-300" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                {pauseReason === 'microphone'
                  ? 'Microphone disabled'
                  : pauseReason === 'time-up'
                    ? "Time's up"
                    : 'Session paused'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{pauseMessage}</p>
              <button
                type="button"
                onClick={() => void handleResume()}
                disabled={pauseReason === 'microphone'}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {pauseReason === 'microphone' ? 'Waiting for microphone…' : 'Resume session'}
              </button>
            </div>
          </div>
        )}
      </div>

      {submitError && !submitConfirmOpen && (
        <div className="fixed bottom-4 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-lg border border-rose-500/30 bg-bg-secondary px-4 py-3 text-center text-sm text-rose-300 shadow-lg">
          {submitError}
        </div>
      )}

      <AnimatePresence>
        {restartConfirmOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isRestarting && setRestartConfirmOpen(false)}
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
              aria-labelledby="restart-confirm-title"
            >
              <h2 id="restart-confirm-title" className="text-lg font-semibold text-text-primary">
                Restart question?
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                This clears your current code, interview progress, and timer for this question. You
                will start from session setup again. This cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRestartConfirmOpen(false)}
                  disabled={isRestarting}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRestartQuestion()}
                  disabled={isRestarting}
                  className="flex-1 rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRestarting ? 'Restarting…' : 'Restart'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(submitConfirmOpen || isSubmitting) && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setSubmitConfirmOpen(false)}
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
              aria-labelledby="submit-confirm-title"
            >
              {isSubmitting ? (
                <>
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
                  </div>
                  <h2 id="submit-confirm-title" className="mt-4 text-lg font-semibold text-text-primary">
                    Submitting session…
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Saving your work and preparing feedback.
                  </p>
                </>
              ) : (
                <>
                  <h2 id="submit-confirm-title" className="text-lg font-semibold text-text-primary">
                    Submit session?
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Are you sure you want to submit? This will end your interview and generate feedback.
                    This action cannot be reversed.
                  </p>
                  {submitError && (
                    <p className="mt-3 text-sm text-rose-300" role="alert">
                      {submitError}
                    </p>
                  )}
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmitConfirmOpen(false)}
                      className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSubmit}
                      className="flex-1 rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Submit
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

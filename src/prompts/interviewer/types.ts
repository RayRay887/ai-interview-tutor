/**
 * FAANG interviewer playbook types.
 * @see docs/interviewer/context-schema.md
 */

export type InterviewSessionPhase =
  | 'opening'
  | 'approach'
  | 'implementation'
  | 'testing'
  | 'optimization'
  | 'wrap_up'

export type HintLevel = 0 | 1 | 2 | 3 | 4

export type InterviewLanguage = 'python' | 'javascript' | 'typescript'

export type TranscriptRole = 'interviewer' | 'candidate' | 'hint'

export interface InterviewerQuestionContext {
  title: string
  description: string
  difficulty: string
  category: string
  constraints?: string[]
  examples: { input: string; output: string }[]
}

export interface InterviewerSessionContext {
  language: InterviewLanguage
  minutesTotal: number
  minutesRemaining: number
  phase: InterviewSessionPhase
}

export type ConsoleLevel = 'info' | 'success' | 'error' | 'warn'

/** Compile/runtime panel lines from PracticeSession console. */
export interface InterviewerConsoleEntry {
  level: ConsoleLevel
  message: string
  line?: number
}

export interface InterviewerCodeContext {
  source: string
  changedSinceLastTurn: boolean
  /** Set when source is omitted or truncated for token budget. */
  lineCount?: number
  truncated?: boolean
}

export interface InterviewerTestsContext {
  passed: number
  total: number
  lastFailures?: string[]
}

export interface InterviewerTranscriptEntry {
  role: TranscriptRole
  text: string
  timestamp: number
}

export interface InterviewerSignals {
  silenceSeconds: number
  testsJustRun: boolean
  candidateAskedForHint: boolean
  approachClarity?: 'vague' | 'partial' | 'concrete'
  approachProbeCount?: number
  /** Seconds the candidate paused before this turn (0 if not a post-pause turn). */
  sessionJustResumedAfterPauseSeconds?: number
}

export interface InterviewerHintState {
  levelUsed: HintLevel
}

export interface InterviewerContext {
  question: InterviewerQuestionContext
  session: InterviewerSessionContext
  code: InterviewerCodeContext
  tests: InterviewerTestsContext
  /** Recent console panel entries (errors/warnings prioritized). */
  console?: InterviewerConsoleEntry[]
  transcript: InterviewerTranscriptEntry[]
  signals: InterviewerSignals
  hintState: InterviewerHintState
}

/** Phase boundaries as fractions of total session minutes. */
export const PHASE_FRACTIONS: Record<InterviewSessionPhase, { start: number; end: number }> = {
  opening: { start: 0, end: 0.05 },
  approach: { start: 0.05, end: 0.25 },
  implementation: { start: 0.25, end: 0.7 },
  testing: { start: 0.7, end: 0.85 },
  optimization: { start: 0.85, end: 0.95 },
  wrap_up: { start: 0.95, end: 1 },
}

export function getPhaseForElapsedRatio(ratio: number): InterviewSessionPhase {
  if (ratio < 0.05) return 'opening'
  if (ratio < 0.25) return 'approach'
  if (ratio < 0.7) return 'implementation'
  if (ratio < 0.85) return 'testing'
  if (ratio < 0.95) return 'optimization'
  return 'wrap_up'
}

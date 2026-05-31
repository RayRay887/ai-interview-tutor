/**
 * Token-aware InterviewerContext serialization for LLM turns.
 * @see docs/interviewer/token-budget.md
 */

import type {
  InterviewerContext,
  InterviewerConsoleEntry,
  InterviewerTranscriptEntry,
} from './types'

export type { InterviewerContext, InterviewerConsoleEntry }

export function fromPracticeConsole(
  entries: { level: 'info' | 'success' | 'error' | 'warn'; message: string; line?: number }[],
): InterviewerConsoleEntry[] {
  return entries.map(({ level, message, line }) => ({ level, message, line }))
}

export const DEFAULT_LIMITS = {
  codeMaxChars: 2500,
  transcriptMaxTurns: 12,
  candidateTextMaxChars: 500,
  consoleMaxEntries: 6,
  consoleMessageMaxChars: 120,
  failureMaxCount: 3,
  failureMaxChars: 80,
} as const

export interface BuildContextOptions {
  /** First turn of session — include full question description */
  isOpening?: boolean
  limits?: Partial<typeof DEFAULT_LIMITS>
}

export interface BuildContextStats {
  approxChars: number
  codeIncluded: boolean
  codeTruncated: boolean
  transcriptTurns: number
  consoleEntries: number
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

/** Middle-elide long code to preserve function signature + recent edits. */
export function truncateCode(source: string, maxChars = DEFAULT_LIMITS.codeMaxChars): {
  text: string
  truncated: boolean
  lineCount: number
} {
  const lineCount = source ? source.split('\n').length : 0
  if (source.length <= maxChars) {
    return { text: source, truncated: false, lineCount }
  }

  const headSize = Math.floor(maxChars * 0.4)
  const tailSize = Math.floor(maxChars * 0.4)
  const omittedLines = lineCount - source.slice(0, headSize).split('\n').length - source.slice(-tailSize).split('\n').length
  const middle = `\n… (${Math.max(omittedLines, 1)} lines omitted) …\n`

  return {
    text: source.slice(0, headSize) + middle + source.slice(-tailSize),
    truncated: true,
    lineCount,
  }
}

export function sliceTranscript(
  transcript: InterviewerTranscriptEntry[],
  maxTurns = DEFAULT_LIMITS.transcriptMaxTurns,
  candidateMax = DEFAULT_LIMITS.candidateTextMaxChars,
): InterviewerTranscriptEntry[] {
  if (transcript.length <= maxTurns) {
    return transcript.map((entry) =>
      entry.role === 'candidate'
        ? { ...entry, text: truncateText(entry.text, candidateMax) }
        : entry,
    )
  }

  const opening = transcript[0]
  const recent = transcript.slice(-(maxTurns - 1))
  const merged = opening && recent[0]?.timestamp !== opening.timestamp ? [opening, ...recent] : recent

  return merged.map((entry) =>
    entry.role === 'candidate'
      ? { ...entry, text: truncateText(entry.text, candidateMax) }
      : entry,
  )
}

export function compactConsoleEntries(
  entries: InterviewerConsoleEntry[],
  options?: { maxEntries?: number; messageMax?: number; errorsOnly?: boolean },
): InterviewerConsoleEntry[] {
  const maxEntries = options?.maxEntries ?? DEFAULT_LIMITS.consoleMaxEntries
  const messageMax = options?.messageMax ?? DEFAULT_LIMITS.consoleMessageMaxChars
  const errorsOnly = options?.errorsOnly ?? false

  let filtered = errorsOnly
    ? entries.filter((e) => e.level === 'error' || e.level === 'warn')
    : entries

  filtered = filtered.filter((entry, index, arr) => {
    if (index === 0) return true
    const prev = arr[index - 1]
    return prev.message !== entry.message || prev.level !== entry.level
  })

  return filtered.slice(-maxEntries).map((entry) => ({
    ...entry,
    message: truncateText(entry.message, messageMax),
  }))
}

/** Compact payload for the LLM — omits heavy fields when unnecessary. */
export function buildInterviewerPayload(
  context: InterviewerContext,
  options: BuildContextOptions = {},
): Record<string, unknown> {
  const limits = { ...DEFAULT_LIMITS, ...options.limits }
  const { isOpening = false } = options
  const codingPhases = new Set(['implementation', 'testing', 'optimization'])

  const question =
    isOpening || context.transcript.length <= 1
      ? context.question
      : {
          title: context.question.title,
          difficulty: context.question.difficulty,
          category: context.question.category,
          constraints: context.question.constraints,
        }

  let codeBlock: Record<string, unknown>
  if (!codingPhases.has(context.session.phase) && !context.code.changedSinceLastTurn) {
    codeBlock = {
      lineCount: context.code.lineCount ?? context.code.source.split('\n').length,
      note: 'Approach phase — full source omitted to save tokens.',
    }
  } else if (!context.code.changedSinceLastTurn && context.code.source) {
    codeBlock = {
      changedSinceLastTurn: false,
      lineCount: context.code.lineCount ?? context.code.source.split('\n').length,
    }
  } else {
    const { text, truncated, lineCount } = truncateCode(context.code.source, limits.codeMaxChars)
    codeBlock = {
      source: text,
      changedSinceLastTurn: context.code.changedSinceLastTurn,
      lineCount,
      ...(truncated ? { truncated: true } : {}),
    }
  }

  const failures = context.tests.lastFailures
    ?.slice(0, limits.failureMaxCount)
    .map((f) => truncateText(f, limits.failureMaxChars))

  const consoleEntries = context.console?.length
    ? compactConsoleEntries(context.console, {
        maxEntries: limits.consoleMaxEntries,
        messageMax: limits.consoleMessageMaxChars,
        errorsOnly: !context.signals.testsJustRun,
      })
    : undefined

  return {
    question,
    session: context.session,
    code: codeBlock,
    tests: {
      passed: context.tests.passed,
      total: context.tests.total,
      ...(failures?.length ? { lastFailures: failures } : {}),
    },
    ...(consoleEntries?.length ? { console: consoleEntries } : {}),
    transcript: sliceTranscript(context.transcript, limits.transcriptMaxTurns),
    signals: context.signals,
    hintState: context.hintState,
  }
}

export function buildInterviewerUserMessage(
  context: InterviewerContext,
  options: BuildContextOptions & { candidateLatest?: string } = {},
): string {
  const payload = buildInterviewerPayload(context, options)
  const lines = [
    'Interview context (JSON):',
    JSON.stringify(payload),
    '',
    `Current phase: ${context.session.phase}`,
    `Minutes remaining: ${context.session.minutesRemaining}`,
  ]

  if (options.candidateLatest) {
    lines.push(`Candidate just said: "${truncateText(options.candidateLatest, DEFAULT_LIMITS.candidateTextMaxChars)}"`)
  }

  lines.push('', 'Respond as the interviewer (spoken English only). Return JSON with reply and role.')

  return lines.join('\n')
}

export function buildContextStats(
  context: InterviewerContext,
  options: BuildContextOptions = {},
): BuildContextStats {
  const payload = buildInterviewerPayload(context, options)
  const json = JSON.stringify(payload)
  const code = payload.code as Record<string, unknown>

  return {
    approxChars: json.length,
    codeIncluded: typeof code.source === 'string',
    codeTruncated: code.truncated === true,
    transcriptTurns: (payload.transcript as unknown[]).length,
    consoleEntries: Array.isArray(payload.console) ? payload.console.length : 0,
  }
}

import type { CodeLanguage } from '../../data/languages'
import type { ConsoleEntry, TestCase, TestResult } from '../../lib/codeRunner'
import type { Question } from '../../data/questions'
import type {
  HintLevel,
  InterviewerContext,
  InterviewerTranscriptEntry,
} from './types'
import { getPhaseForElapsedRatio } from './types'
import { fromPracticeConsole } from './buildContext'

import { isAlreadyCoding } from './codingState'

export interface PracticeSessionSnapshot {
  code: string
  language: CodeLanguage
  consoleEntries: ConsoleEntry[]
  passedCount: number
  totalCount: number
  lastFailures: string[]
  hiddenPassed?: number
  hiddenTotal?: number
  remainingSeconds: number
  sessionMinutes: number
  testsJustRun: boolean
}

export function buildLastFailures(
  testResults: TestResult[],
  testCases: TestCase[],
): string[] {
  return testResults.flatMap((result, index) => {
    if (result.status !== 'failed') return []
    const label = `Case ${index + 1}`
    if (result.error) return [`${label}: ${result.error}`]
    if (result.actual) {
      return [`${label}: expected ${testCases[index]?.output ?? '?'}, got ${result.actual}`]
    }
    return [`${label}: failed`]
  })
}

const HINT_PATTERN = /\b(hint|stuck|help me|need help|give me a nudge)\b/i

export function candidateAskedForHint(text: string): boolean {
  return HINT_PATTERN.test(text)
}

export function buildInterviewerContext(
  question: Question,
  snapshot: PracticeSessionSnapshot,
  transcript: InterviewerTranscriptEntry[],
  hintLevel: HintLevel,
  codeAtLastTurn: string,
  silenceSeconds: number,
  starterCode: string,
): InterviewerContext {
  const minutesRemaining = Math.ceil(snapshot.remainingSeconds / 60)
  const elapsedRatio =
    snapshot.sessionMinutes > 0
      ? (snapshot.sessionMinutes * 60 - snapshot.remainingSeconds) /
        (snapshot.sessionMinutes * 60)
      : 0

  const testFailures = [...snapshot.lastFailures]
  if (snapshot.hiddenTotal) {
    testFailures.push(`Hidden: ${snapshot.hiddenPassed ?? 0}/${snapshot.hiddenTotal} passed`)
  }

  return {
    question: {
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      category: question.category,
      constraints: question.constraints,
      examples: question.examples,
    },
    session: {
      language: snapshot.language,
      minutesTotal: snapshot.sessionMinutes,
      minutesRemaining,
      phase: getPhaseForElapsedRatio(elapsedRatio),
    },
    code: {
      source: snapshot.code,
      changedSinceLastTurn: snapshot.code !== codeAtLastTurn,
      lineCount: snapshot.code.split('\n').length,
    },
    tests: {
      passed: snapshot.passedCount + (snapshot.hiddenPassed ?? 0),
      total: snapshot.totalCount + (snapshot.hiddenTotal ?? 0),
      ...(testFailures.length ? { lastFailures: testFailures } : {}),
    },
    console: fromPracticeConsole(snapshot.consoleEntries),
    transcript,
    signals: {
      silenceSeconds,
      testsJustRun: snapshot.testsJustRun,
      candidateAskedForHint: false,
      alreadyCoding: isAlreadyCoding(
        snapshot.code,
        starterCode,
        snapshot.code !== codeAtLastTurn,
      ),
    },
    hintState: { levelUsed: hintLevel },
  }
}

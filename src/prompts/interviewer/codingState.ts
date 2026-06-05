import type { InterviewSessionPhase } from './types'

const CODING_PHASES = new Set<InterviewSessionPhase>([
  'implementation',
  'testing',
  'optimization',
])

/** True when the candidate has moved beyond the starter template or edited meaningfully. */
export function isAlreadyCoding(
  code: string,
  starterCode: string,
  changedSinceLastTurn: boolean,
): boolean {
  const trimmed = code.trim()
  const starterTrimmed = starterCode.trim()

  if (trimmed !== starterTrimmed) return true
  if (changedSinceLastTurn && trimmed !== starterTrimmed) return true

  const lineCount = code.split('\n').length
  const starterLineCount = starterCode.split('\n').length
  if (lineCount > starterLineCount) return true

  return false
}

/** True when utterance gating and silence probes should apply. */
export function isCodingMode(sessionPhase: InterviewSessionPhase, alreadyCoding: boolean): boolean {
  return CODING_PHASES.has(sessionPhase) || alreadyCoding
}

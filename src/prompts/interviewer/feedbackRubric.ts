/**
 * FAANG-style post-session feedback rubric split into three debrief sections.
 * Scores use 1–4 per criterion (1 = No Hire … 4 = Strong Hire for that dimension).
 */

export type FeedbackRecommendation =
  | 'strong_hire'
  | 'hire'
  | 'lean_hire'
  | 'lean_no_hire'
  | 'no_hire'

export interface RubricCriterionDefinition {
  id: string
  name: string
  weight: number
  description: string
  anchors: Record<1 | 2 | 3 | 4, string>
}

export const CODE_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'code_quality',
    name: 'Code Quality & Correctness',
    weight: 0.5,
    description: 'Correct logic, readable structure, naming, and maintainability.',
    anchors: {
      1: 'Solution incorrect or largely incomplete; messy or hard to follow.',
      2: 'Partial solution or brittle code; bugs or missed edge cases.',
      3: 'Working solution with clean enough structure; minor issues.',
      4: 'Correct, clean, maintainable code; production-minded structure.',
    },
  },
  {
    id: 'testing',
    name: 'Testing & Verification',
    weight: 0.25,
    description: 'Running tests, debugging failures, validating edge cases.',
    anchors: {
      1: 'Did not test or debug; unaware of failures.',
      2: 'Minimal testing; struggled to fix failures.',
      3: 'Ran tests and fixed issues with some iteration.',
      4: 'Proactively tested, debugged systematically, validated edge cases.',
    },
  },
  {
    id: 'edge_cases',
    name: 'Edge Case Handling',
    weight: 0.25,
    description: 'Empty input, boundaries, duplicates, overflow — handled in code.',
    anchors: {
      1: 'Obvious edge cases break the solution.',
      2: 'Some edge cases handled; others would fail in production.',
      3: 'Most common edge cases covered.',
      4: 'Comprehensive edge-case coverage for the problem constraints.',
    },
  },
]

export const INTERVIEW_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'approach_explanation',
    name: 'Approach Explanation',
    weight: 0.3,
    description: 'Verbal description of strategy before and during coding.',
    anchors: {
      1: 'No clear approach explained; jumped to coding silently.',
      2: 'Vague or incomplete verbal approach; needed heavy prompting.',
      3: 'Explained a reasonable approach with minor gaps.',
      4: 'Clear structured approach explained with tradeoffs.',
    },
  },
  {
    id: 'logic_clarity',
    name: 'Logic & Reasoning',
    weight: 0.3,
    description: 'Whether spoken explanation matches correct algorithmic logic.',
    anchors: {
      1: 'Explanation contradicts code or shows misunderstanding.',
      2: 'Hand-wavy logic; gaps between what they say and what code does.',
      3: 'Logic mostly sound; minor inconsistencies.',
      4: 'Precise verbal walkthrough aligned with correct implementation.',
    },
  },
  {
    id: 'communication',
    name: 'Communication',
    weight: 0.25,
    description: 'Clarity, listening, and responding to interviewer questions.',
    anchors: {
      1: 'Silent, confusing, or dismissive.',
      2: 'Inconsistent; needed repeated prompts.',
      3: 'Clear enough; responded to most questions.',
      4: 'Crisp, proactive, incorporated feedback smoothly.',
    },
  },
  {
    id: 'collaboration',
    name: 'Collaboration & Autonomy',
    weight: 0.15,
    description: 'Independence, hint reliance, and pacing under pressure.',
    anchors: {
      1: 'Stuck; required many hints or could not progress.',
      2: 'Slow; relied on multiple hints.',
      3: 'Reasonable pace with occasional nudges.',
      4: 'Strong independent progress; hints rare and well-used.',
    },
  },
]

export const OPTIMIZATION_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'time_complexity',
    name: 'Time Complexity',
    weight: 0.35,
    description: 'Correct Big-O time analysis tied to the implementation.',
    anchors: {
      1: 'No time analysis or clearly wrong.',
      2: 'Hand-wavy or incorrect time Big-O.',
      3: 'Correct or mostly correct time complexity.',
      4: 'Precise time analysis with justification.',
    },
  },
  {
    id: 'space_complexity',
    name: 'Space Complexity',
    weight: 0.25,
    description: 'Correct auxiliary space analysis.',
    anchors: {
      1: 'No space analysis or clearly wrong.',
      2: 'Incorrect or missing auxiliary space discussion.',
      3: 'Correct or mostly correct space complexity.',
      4: 'Precise space analysis including tradeoffs.',
    },
  },
  {
    id: 'optimization',
    name: 'Optimization & Alternatives',
    weight: 0.4,
    description: 'Whether solution is optimal; awareness of better approaches.',
    anchors: {
      1: 'Far from optimal; no awareness of better approaches.',
      2: 'Suboptimal; vague sense improvements exist.',
      3: 'Reasonably efficient; could name one improvement.',
      4: 'Optimal or near-optimal; discussed alternatives and tradeoffs.',
    },
  },
]

export const SECTION_WEIGHTS = {
  code: 0.4,
  interview: 0.35,
  optimization: 0.25,
} as const

/** @deprecated Use section rubrics — kept for migration references. */
export const FEEDBACK_RUBRIC = [...CODE_RUBRIC, ...INTERVIEW_RUBRIC, ...OPTIMIZATION_RUBRIC]

export const RECOMMENDATION_LABELS: Record<FeedbackRecommendation, string> = {
  strong_hire: 'Strong Hire',
  hire: 'Hire',
  lean_hire: 'Lean Hire',
  lean_no_hire: 'Lean No Hire',
  no_hire: 'No Hire',
}

export function scoreToRecommendation(overallScore: number): FeedbackRecommendation {
  if (overallScore >= 85) return 'strong_hire'
  if (overallScore >= 72) return 'hire'
  if (overallScore >= 58) return 'lean_hire'
  if (overallScore >= 42) return 'lean_no_hire'
  return 'no_hire'
}

export function weightedSectionScore(
  criteria: { id: string; score: number }[],
  rubric: RubricCriterionDefinition[],
): number {
  let total = 0
  let weightSum = 0

  for (const def of rubric) {
    const match = criteria.find((c) => c.id === def.id)
    if (!match) continue
    const score = Math.min(4, Math.max(1, match.score))
    total += score * def.weight
    weightSum += def.weight
  }

  if (weightSum === 0) return 0
  const avg = total / weightSum
  return Math.round(((avg - 1) / 3) * 100)
}

export function computeOverallScore(sectionScores: {
  code: number
  interview: number
  optimization: number
}): number {
  const weighted =
    sectionScores.code * SECTION_WEIGHTS.code +
    sectionScores.interview * SECTION_WEIGHTS.interview +
    sectionScores.optimization * SECTION_WEIGHTS.optimization
  return Math.round(weighted)
}

export function buildSectionRubricPrompt(
  title: string,
  rubric: RubricCriterionDefinition[],
  focus: string,
): string {
  const lines = rubric.map(
    (c) =>
      `- ${c.id} (${c.name}, ${Math.round(c.weight * 100)}%): ${c.description}\n` +
      `  1: ${c.anchors[1]}\n  2: ${c.anchors[2]}\n  3: ${c.anchors[3]}\n  4: ${c.anchors[4]}`,
  )
  return `${title}\nFocus: ${focus}\n${lines.join('\n')}`
}

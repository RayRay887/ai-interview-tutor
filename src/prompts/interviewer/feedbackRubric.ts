/**
 * Post-session feedback rubric for Prepify debriefs.
 *
 * Synthesized from:
 * - Tech Interview Handbook — Communication, Problem Solving, Technical Competency, Testing
 *   https://www.techinterviewhandbook.org/coding-interview-rubrics/
 * - The Golden Rubric — Coding & Syntax, Data Structures & Algorithms, Problem Solving,
 *   Communication, Thrives in Ambiguity, Values Feedback (1–4 per category, max 24)
 *   https://medium.com/swlh/the-golden-rubric-for-technical-interviews-2f087ef2ba1
 *
 * Scores: 1 = Strong No Hire / Strong Don't Hire, 2 = Leaning No Hire, 3 = Leaning Hire, 4 = Strong Hire
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
  /** Which canonical framework this criterion maps to. */
  source: 'tih' | 'golden'
  anchors: Record<1 | 2 | 3 | 4, string>
}

/** TIH Technical Competency + Testing + Golden Coding & Syntax */
export const CODE_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'technical_competency',
    name: 'Technical Competency',
    weight: 0.4,
    source: 'tih',
    description:
      'Translates the discussed approach into working code with minimal bugs; clean style, DRY, proper abstractions.',
    anchors: {
      1: 'Could not produce a working solution. Major syntax errors and very poor use of language paradigms.',
      2: 'Struggled to produce working code. Multiple syntax errors and suboptimal language usage.',
      3: 'Working solution with some difficulty translating approach to code. Basic competency only.',
      4: 'Effortless working code — clean, DRY, good naming/indentation, strong language knowledge.',
    },
  },
  {
    id: 'coding_syntax',
    name: 'Coding & Syntax',
    weight: 0.25,
    source: 'golden',
    description:
      'Syntax correctness and fluency with language constructs when implementing the solution.',
    anchors: {
      1: 'Several logical or syntactic errors that severely impacted correctness.',
      2: 'Minor syntax errors; stumbled while coding the naive solution.',
      3: 'Few-to-no syntax errors; translated proposed solution with little difficulty.',
      4: 'No syntax errors; translated solution effortlessly; compares coding approaches.',
    },
  },
  {
    id: 'testing',
    name: 'Testing & Verification',
    weight: 0.35,
    source: 'tih',
    description:
      'Tests typical and corner cases, self-corrects bugs, verifies correctness systematically.',
    anchors: {
      1: 'Did not test against typical cases; did not spot glaring bugs before finishing.',
      2: 'Tested but missed corner cases; could not identify or correct bugs reliably.',
      3: 'Some difficulty with testing — not all relevant corner cases covered.',
      4: 'Demonstrated testing signals effortlessly — typical + corner cases, self-corrected bugs.',
    },
  },
]

/** TIH Communication + Golden Communication, Thrives in Ambiguity, Values Feedback, Problem Solving (verbal) */
export const INTERVIEW_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'communication',
    name: 'Communication',
    weight: 0.25,
    source: 'tih',
    description:
      'Clarifying questions, explaining approach/rationale/tradeoffs, communicating while coding.',
    anchors: {
      1: 'Silent, incoherent, or could not be followed; ignored direct interviewer questions.',
      2: 'Disorganized or insufficient; jumped to code; did not respond clearly when asked follow-ups.',
      3: 'Sufficient and clear communication; interviewer occasionally needed follow-ups.',
      4: 'Thorough, well-organized, succinct — thought process easy to follow throughout.',
    },
  },
  {
    id: 'answer_relevance',
    name: 'Answer Relevance',
    weight: 0.3,
    source: 'tih',
    description:
      'Directly addresses what the interviewer asked — complexity probes, approach questions, and follow-ups.',
    anchors: {
      1: 'Repeatedly off-topic, evasive, or non-answers when directly asked (e.g. complexity question → unrelated tangent).',
      2: 'Often dodged direct questions or answers did not address the interviewer prompt.',
      3: 'Usually relevant; occasional vague or partial answers to direct questions.',
      4: 'Directly and clearly answered every interviewer question including complexity and approach probes.',
    },
  },
  {
    id: 'problem_solving',
    name: 'Problem Solving',
    weight: 0.2,
    source: 'tih',
    description:
      'Understands the problem quickly, approaches systematically, reaches a sound solution in time.',
    anchors: {
      1: 'Unable to solve or did so without explaining; disorganized and incorrect approach.',
      2: 'Showed only some basic signals; barely finished or needed many incorrect attempts.',
      3: 'Achieved basic problem-solving signals; limited time for extensions or alternatives.',
      4: 'All basic signals plus advanced — multiple solutions, tradeoffs, follow-up discussion.',
    },
  },
  {
    id: 'thrives_in_ambiguity',
    name: 'Thrives in Ambiguity',
    weight: 0.15,
    source: 'golden',
    description:
      'Works independently, asks good clarifying questions, discusses edge cases and assumptions early.',
    anchors: {
      1: 'Struggled independently; did not attempt unfamiliar aspects; relied on interviewer.',
      2: 'Required several major hints; unclear if they could progress without assistance.',
      3: 'Required minor hints; asked a few good questions; handled edge cases once clear.',
      4: 'Worked independently; discussed edge cases early; engaged in thoughtful multi-solution discussion.',
    },
  },
  {
    id: 'values_feedback',
    name: 'Values Feedback',
    weight: 0.1,
    source: 'golden',
    description:
      'Incorporates interviewer hints and nudges; seeks to understand feedback and adjust approach.',
    anchors: {
      1: 'Ignored or barely used hints; blind to interviewer direction.',
      2: 'Incorporated feedback slowly without demonstrating understanding.',
      3: 'Incorporated feedback quickly; did not deeply engage with why.',
      4: 'Incorporated feedback quickly; understood deeply and challenged appropriately.',
    },
  },
]

/** Golden Data Structures & Algorithms + TIH problem-solving optimization signals */
export const OPTIMIZATION_RUBRIC: RubricCriterionDefinition[] = [
  {
    id: 'data_structures_algorithms',
    name: 'Data Structures & Algorithms',
    weight: 0.35,
    source: 'golden',
    description:
      'Appropriate DS/algo choice; explains naive vs optimized solutions and selects the best fit.',
    anchors: {
      1: 'Poorly suited data structures; lacking knowledge of basics; stuck on naive approach.',
      2: 'Sub-optimal DS choice; naive algorithm with minor misunderstanding of internals.',
      3: 'Naive algorithm with proper DS; explained or coded a slightly more optimized solution.',
      4: 'Explained naive drawbacks, several solutions, selected optimal with clear tradeoffs.',
    },
  },
  {
    id: 'time_complexity',
    name: 'Time Complexity',
    weight: 0.25,
    source: 'tih',
    description: 'Accurate Big-O time analysis tied to the chosen algorithm and implementation.',
    anchors: {
      1: 'Interviewer asked about time complexity; candidate did not answer, went off-topic, or gave clearly wrong Big-O.',
      2: 'Hand-wavy, avoided the question, or wrong time complexity when prompted.',
      3: 'Correct or mostly correct time Big-O stated in speech with brief justification.',
      4: 'Precise time analysis with justification and comparison to alternatives.',
    },
  },
  {
    id: 'space_complexity',
    name: 'Space Complexity',
    weight: 0.2,
    source: 'tih',
    description: 'Accurate auxiliary space analysis for the implementation.',
    anchors: {
      1: 'No space analysis when asked, or clearly incorrect; inferred from code alone does not count.',
      2: 'Incorrect or missing auxiliary space discussion after a direct prompt.',
      3: 'Correct or mostly correct space Big-O stated in speech.',
      4: 'Precise space analysis including tradeoffs vs time-optimized variants.',
    },
  },
  {
    id: 'optimization_tradeoffs',
    name: 'Optimization & Tradeoffs',
    weight: 0.2,
    source: 'golden',
    description:
      'Runtime vs space tradeoffs in context of constraints; awareness of whether solution is optimal.',
    anchors: {
      1: 'No awareness of better approaches; dodged optimization/complexity discussion entirely.',
      2: 'Vague sense of improvements; cannot articulate runtime vs space tradeoffs when asked.',
      3: 'Reasonably efficient; can evaluate O-notation and suggest one improvement.',
      4: 'Explained runtime vs space tradeoffs under product constraints; near-optimal choice.',
    },
  },
]

export const SECTION_WEIGHTS = {
  code: 0.4,
  interview: 0.35,
  optimization: 0.25,
} as const

export const FEEDBACK_RUBRIC = [...CODE_RUBRIC, ...INTERVIEW_RUBRIC, ...OPTIMIZATION_RUBRIC]

export const RECOMMENDATION_LABELS: Record<FeedbackRecommendation, string> = {
  strong_hire: 'Strong Hire',
  hire: 'Hire',
  lean_hire: 'Lean Hire',
  lean_no_hire: 'Lean No Hire',
  no_hire: 'No Hire',
}

/** Maps 0–100 overall to hire bands (aligned with TIH Strong Hire → Strong No Hire). */
export function scoreToRecommendation(overallScore: number): FeedbackRecommendation {
  if (overallScore >= 88) return 'strong_hire'
  if (overallScore >= 75) return 'hire'
  if (overallScore >= 60) return 'lean_hire'
  if (overallScore >= 45) return 'lean_no_hire'
  return 'no_hire'
}

/** Appended to LLM system prompts — evidence-only grading rules used at Google/Meta-style debriefs. */
export const FEEDBACK_STRICT_GRADING_RULES = `
STRICT EVIDENCE-BASED GRADING (non-negotiable):
- Grade ONLY from transcript quotes and submitted code/tests. Do not infer skills the candidate did not demonstrate in speech.
- If the interviewer asked about time or space complexity and the candidate did not state Big-O or complexity analysis in the transcript → time_complexity=1, space_complexity=1, optimization_tradeoffs≤2, answer_relevance≤2.
- Off-topic, evasive, or unrelated answers to direct interviewer questions → answer_relevance≤2 and communication≤2. Quote the exchange in the summary.
- Passing all tests does NOT raise interview or optimization scores. Working code without verbal complexity analysis is at most Lean Hire on optimization.
- Summaries must cite specific transcript evidence (what was asked vs what was answered). Never give 3 or 4 on verbal criteria without clear spoken evidence.
- hintsUsed >= 2 caps thrives_in_ambiguity and values_feedback at 2 unless transcript shows strong independent recovery.
`.trim()

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

/** Full rubric text for LLM system prompts. */
export function buildFeedbackSystemPromptSection(): string {
  return [
    buildSectionRubricPrompt(
      'CODE SECTION (grade from submitted code + test results only)',
      CODE_RUBRIC,
      'Tech Interview Handbook Technical Competency & Testing; Golden Rubric Coding & Syntax.',
    ),
    '',
    buildSectionRubricPrompt(
      'INTERVIEW SECTION (grade from voice transcript + session hints only — NOT from code)',
      INTERVIEW_RUBRIC,
      'Tech Interview Handbook Communication & Problem Solving; Golden Communication, Thrives in Ambiguity, Values Feedback. answer_relevance is critical: did the candidate address what was asked?',
    ),
    '',
    buildSectionRubricPrompt(
      'OPTIMIZATION SECTION (grade from transcript + code — complexity must be stated in speech to score above 2)',
      OPTIMIZATION_RUBRIC,
      'Golden Data Structures & Algorithms; time/space Big-O must appear in transcript if interviewer asked. Do not infer Big-O from code alone.',
    ),
    '',
    FEEDBACK_STRICT_GRADING_RULES,
    '',
    'Also return optimization.timeComplexity, optimization.spaceComplexity (e.g. "O(n)" or "Not answered in interview"), optimization.isOptimal (boolean), optimization.optimizationSummary (string).',
    'Scale per criterion: 1=Strong No Hire, 2=Leaning No Hire, 3=Leaning Hire, 4=Strong Hire.',
    'Each section: 2-4 strengths and 2-4 improvements. recommendation: strong_hire|hire|lean_hire|lean_no_hire|no_hire. headline: one sentence.',
  ].join('\n')
}

export const CODE_CRITERION_IDS = CODE_RUBRIC.map((c) => c.id)
export const INTERVIEW_CRITERION_IDS = INTERVIEW_RUBRIC.map((c) => c.id)
export const OPTIMIZATION_CRITERION_IDS = OPTIMIZATION_RUBRIC.map((c) => c.id)

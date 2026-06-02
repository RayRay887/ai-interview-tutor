import {
  CODE_RUBRIC,
  computeOverallScore,
  INTERVIEW_RUBRIC,
  OPTIMIZATION_RUBRIC,
  scoreToRecommendation,
  weightedSectionScore,
  type RubricCriterionDefinition,
} from '../prompts/interviewer/feedbackRubric'
import type {
  FeedbackSection,
  InterviewFeedbackRequest,
  InterviewFeedbackResult,
  OptimizationSection,
} from '../types/feedback'
import { isSupabaseConfigured, supabase } from './supabase'

export class InterviewFeedbackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterviewFeedbackError'
  }
}

function normalizeCriteria(
  raw: { id?: string; score?: number; summary?: string }[],
  rubric: RubricCriterionDefinition[],
) {
  return rubric.map((def) => {
    const match = raw.find((item) => item.id === def.id)
    const score = Math.min(4, Math.max(1, Math.round(Number(match?.score) || 2)))
    return {
      id: def.id,
      name: def.name,
      score,
      weight: def.weight,
      summary: (match?.summary ?? '').trim() || def.anchors[score as 1 | 2 | 3 | 4],
    }
  })
}

function normalizeSection(
  raw: Record<string, unknown> | undefined,
  rubric: RubricCriterionDefinition[],
): FeedbackSection {
  const rawCriteria = Array.isArray(raw?.criteria)
    ? (raw.criteria as { id?: string; score?: number; summary?: string }[])
    : []
  const criteria = normalizeCriteria(rawCriteria, rubric)
  const strengths = Array.isArray(raw?.strengths)
    ? raw.strengths.filter((s): s is string => typeof s === 'string').slice(0, 4)
    : []
  const improvements = Array.isArray(raw?.improvements)
    ? raw.improvements.filter((s): s is string => typeof s === 'string').slice(0, 4)
    : []

  return {
    score: weightedSectionScore(criteria, rubric),
    criteria,
    strengths,
    improvements,
  }
}

function normalizeOptimizationSection(
  raw: Record<string, unknown> | undefined,
): OptimizationSection {
  const base = normalizeSection(raw, OPTIMIZATION_RUBRIC)
  return {
    ...base,
    timeComplexity:
      typeof raw?.timeComplexity === 'string' && raw.timeComplexity.trim()
        ? raw.timeComplexity.trim()
        : 'Not discussed',
    spaceComplexity:
      typeof raw?.spaceComplexity === 'string' && raw.spaceComplexity.trim()
        ? raw.spaceComplexity.trim()
        : 'Not discussed',
    isOptimal: raw?.isOptimal === true,
    optimizationSummary:
      typeof raw?.optimizationSummary === 'string' && raw.optimizationSummary.trim()
        ? raw.optimizationSummary.trim()
        : base.criteria.find((c) => c.id === 'optimization')?.summary ?? '',
  }
}

function normalizeFeedback(
  parsed: Record<string, unknown>,
  request: InterviewFeedbackRequest,
): InterviewFeedbackResult {
  const code = normalizeSection(parsed.code as Record<string, unknown>, CODE_RUBRIC)
  const interview = normalizeSection(parsed.interview as Record<string, unknown>, INTERVIEW_RUBRIC)
  const optimization = normalizeOptimizationSection(
    parsed.optimization as Record<string, unknown>,
  )

  const overallScore = computeOverallScore({
    code: code.score,
    interview: interview.score,
    optimization: optimization.score,
  })

  const recommendation =
    typeof parsed.recommendation === 'string' &&
    ['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire'].includes(parsed.recommendation)
      ? (parsed.recommendation as InterviewFeedbackResult['recommendation'])
      : scoreToRecommendation(overallScore)

  const headline =
    typeof parsed.headline === 'string' && parsed.headline.trim()
      ? parsed.headline.trim()
      : request.tests.allPassed
        ? 'Solid session — review each section below for detailed feedback.'
        : 'Solution not fully passing — focus on code correctness and testing next time.'

  return {
    overallScore,
    recommendation,
    headline,
    code,
    interview,
    optimization,
  }
}

async function fetchDevFeedback(body: InterviewFeedbackRequest): Promise<InterviewFeedbackResult> {
  const response = await fetch('/api/interview-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let detail = `Feedback API returned ${response.status}.`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) detail = payload.error
    } catch {
      // ignore
    }
    throw new InterviewFeedbackError(
      `${detail} Restart \`npm run dev\` after adding OPENAI_API_KEY to .env.`,
    )
  }

  const data = (await response.json()) as Record<string, unknown>
  return normalizeFeedback(data, body)
}

export async function requestInterviewFeedback(
  body: InterviewFeedbackRequest,
): Promise<InterviewFeedbackResult> {
  if (import.meta.env.DEV) {
    return fetchDevFeedback(body)
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
        'interview-feedback',
        { body },
      )

      if (!error && data) {
        return normalizeFeedback(data, body)
      }
    } catch {
      // fall through
    }
  }

  if (!isSupabaseConfigured()) {
    throw new InterviewFeedbackError('Sign in and configure Supabase to request interview feedback.')
  }

  throw new InterviewFeedbackError(
    'Interview feedback is unavailable. Deploy the interview-feedback Supabase function.',
  )
}

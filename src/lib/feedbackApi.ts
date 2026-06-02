import {
  CODE_RUBRIC,
  INTERVIEW_RUBRIC,
  OPTIMIZATION_RUBRIC,
  weightedSectionScore,
  type RubricCriterionDefinition,
} from '../prompts/interviewer/feedbackRubric'
import type {
  FeedbackSection,
  InterviewFeedbackRequest,
  InterviewFeedbackResult,
  OptimizationSection,
} from '../types/feedback'
import { applyStrictFeedbackCaps } from './applyStrictFeedbackCaps'
import { isSupabaseConfigured, supabase } from './supabase'

/** Dedupes feedback API calls so Strict Mode / effect re-runs cannot change the score. */
const feedbackInflight = new Map<string, Promise<InterviewFeedbackResult>>()
const feedbackResultCache = new Map<string, InterviewFeedbackResult>()

export function getCachedFeedbackResult(
  feedbackRequestId: string,
): InterviewFeedbackResult | undefined {
  return feedbackResultCache.get(feedbackRequestId)
}

export function clearFeedbackRequestCache(feedbackRequestId: string) {
  feedbackResultCache.delete(feedbackRequestId)
  feedbackInflight.delete(feedbackRequestId)
}

export function requestInterviewFeedbackOnce(
  feedbackRequestId: string,
  body: InterviewFeedbackRequest,
): Promise<InterviewFeedbackResult> {
  const cached = feedbackResultCache.get(feedbackRequestId)
  if (cached) return Promise.resolve(cached)

  let inflight = feedbackInflight.get(feedbackRequestId)
  if (!inflight) {
    inflight = requestInterviewFeedback(body).then((result) => {
      feedbackResultCache.set(feedbackRequestId, result)
      feedbackInflight.delete(feedbackRequestId)
      return result
    })
    feedbackInflight.set(feedbackRequestId, inflight)
  }
  return inflight
}

export class InterviewFeedbackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterviewFeedbackError'
  }
}

function normalizeCriteria(
  raw: { id?: string; score?: number; summary?: string }[],
  rubric: RubricCriterionDefinition[],
  missingDefault = 1,
) {
  return rubric.map((def) => {
    const match = raw.find((item) => item.id === def.id)
    const score = Math.min(4, Math.max(1, Math.round(Number(match?.score) || missingDefault)))
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
  missingDefault = 1,
): FeedbackSection {
  const rawCriteria = Array.isArray(raw?.criteria)
    ? (raw.criteria as { id?: string; score?: number; summary?: string }[])
    : []
  const criteria = normalizeCriteria(rawCriteria, rubric, missingDefault)
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
        : base.criteria.find((c) => c.id === 'optimization_tradeoffs')?.summary ?? '',
  }
}

function normalizeFeedback(
  parsed: Record<string, unknown>,
  request: InterviewFeedbackRequest,
): InterviewFeedbackResult {
  const code = normalizeSection(parsed.code as Record<string, unknown>, CODE_RUBRIC, 2)
  const interview = normalizeSection(
    parsed.interview as Record<string, unknown>,
    INTERVIEW_RUBRIC,
    1,
  )
  const optimization = normalizeOptimizationSection(
    parsed.optimization as Record<string, unknown>,
  )

  const headline =
    typeof parsed.headline === 'string' && parsed.headline.trim()
      ? parsed.headline.trim()
      : request.tests.allPassed
        ? 'Solid session — review each section below for detailed feedback.'
        : 'Solution not fully passing — focus on code correctness and testing next time.'

  const draft: InterviewFeedbackResult = {
    overallScore: 0,
    recommendation: 'no_hire',
    headline,
    code,
    interview,
    optimization,
  }

  return applyStrictFeedbackCaps(draft, request)
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

import type { Difficulty, Question } from '../data/questions'
import type { FeedbackRecommendation } from '../prompts/interviewer/feedbackRubric'
import type { InterviewFeedbackRequest, InterviewFeedbackResult } from '../types/feedback'
import { requireSupabase } from './supabase'

export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned'

export interface PracticeAttemptRow {
  id: string
  user_id: string
  status: AttemptStatus
  question_slug: string
  question_title: string
  difficulty: Difficulty
  category: string
  session_minutes_planned: number
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  code: string | null
  language: string | null
  tests_passed: number | null
  tests_total: number | null
  all_tests_passed: boolean | null
  hidden_passed: number | null
  hidden_total: number | null
  hints_used: number
  transcript: { role: string; text: string }[]
}

export interface AttemptFeedbackRow {
  attempt_id: string
  overall_score: number
  recommendation: FeedbackRecommendation
  headline: string
  feedback: InterviewFeedbackResult
  created_at: string
}

export interface PracticeAttemptWithFeedback extends PracticeAttemptRow {
  attempt_feedback: AttemptFeedbackRow | null
}

export interface FinalizeAttemptSnapshot {
  code: string
  language: string
  testsPassed: number
  testsTotal: number
  allTestsPassed: boolean
  hiddenPassed?: number
  hiddenTotal?: number
  hintsUsed: number
  transcript: { role: string; text: string }[]
  remainingSeconds: number
  sessionMinutesPlanned: number
}

export interface QuestionAttemptGroup {
  questionSlug: string
  questionTitle: string
  difficulty: Difficulty
  category: string
  attempts: PracticeAttemptWithFeedback[]
}

export function computeDurationSeconds(
  sessionMinutesPlanned: number,
  remainingSeconds: number,
): number {
  const planned = sessionMinutesPlanned * 60
  return Math.max(0, Math.min(planned, planned - remainingSeconds))
}

export function buildFinalizeSnapshotFromAttempt(
  attempt: PracticeAttemptRow,
): FinalizeAttemptSnapshot {
  const plannedSeconds = attempt.session_minutes_planned * 60
  const duration = attempt.duration_seconds ?? 0
  const remainingSeconds = Math.max(0, Math.min(plannedSeconds, plannedSeconds - duration))

  return {
    code: attempt.code ?? '',
    language: attempt.language ?? 'python',
    testsPassed: attempt.tests_passed ?? 0,
    testsTotal: attempt.tests_total ?? 0,
    allTestsPassed: attempt.all_tests_passed ?? false,
    hiddenPassed: attempt.hidden_passed ?? undefined,
    hiddenTotal: attempt.hidden_total ?? undefined,
    hintsUsed: attempt.hints_used,
    transcript: attempt.transcript,
    remainingSeconds,
    sessionMinutesPlanned: attempt.session_minutes_planned,
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '0:00'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function formatPlannedMinutes(minutes: number): string {
  return `${minutes} min`
}

export function formatElapsedOverPlanned(
  durationSeconds: number | null | undefined,
  plannedMinutes: number,
): string {
  const elapsed = formatDuration(durationSeconds)
  return `${elapsed} / ${formatPlannedMinutes(plannedMinutes)}`
}

export function formatHistoryDate(isoOrTimestamp: string | number): string {
  const date = typeof isoOrTimestamp === 'number' ? new Date(isoOrTimestamp) : new Date(isoOrTimestamp)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatTotalPracticeTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 min'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} min`
}

export async function getInProgressAttemptForQuestion(
  userId: string,
  questionSlug: string,
): Promise<PracticeAttemptRow | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('practice_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('question_slug', questionSlug)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return mapAttemptRow(row as Record<string, unknown>)
}

/** Persist in-progress session state without ending the attempt. */
export async function autosavePracticeAttempt(
  attemptId: string,
  userId: string,
  snapshot: FinalizeAttemptSnapshot,
): Promise<void> {
  const durationSeconds = computeDurationSeconds(
    snapshot.sessionMinutesPlanned,
    snapshot.remainingSeconds,
  )

  const client = requireSupabase()
  const { error } = await client
    .from('practice_attempts')
    .update({
      code: snapshot.code,
      language: snapshot.language,
      duration_seconds: durationSeconds,
      tests_passed: snapshot.testsPassed,
      tests_total: snapshot.testsTotal,
      all_tests_passed: snapshot.allTestsPassed,
      hidden_passed: snapshot.hiddenPassed ?? null,
      hidden_total: snapshot.hiddenTotal ?? null,
      hints_used: snapshot.hintsUsed,
      transcript: snapshot.transcript,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .eq('status', 'in_progress')

  if (error) {
    throw new Error(error.message)
  }
}

export async function startPracticeAttempt(
  userId: string,
  question: Question,
  sessionMinutesPlanned: number,
): Promise<string> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('practice_attempts')
    .insert({
      user_id: userId,
      status: 'in_progress',
      question_slug: question.slug,
      question_title: question.title,
      difficulty: question.difficulty,
      category: question.category,
      session_minutes_planned: sessionMinutesPlanned,
      hints_used: 0,
      transcript: [],
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not start practice session.')
  }

  return data.id as string
}

async function incrementTotalPracticeSeconds(userId: string, durationSeconds: number) {
  if (durationSeconds <= 0) return

  const client = requireSupabase()
  const { data: profile, error: readError } = await client
    .from('profiles')
    .select('total_practice_seconds')
    .eq('id', userId)
    .maybeSingle()

  if (readError) {
    throw new Error(readError.message)
  }

  const current = Number(profile?.total_practice_seconds ?? 0)
  const nextTotal = current + durationSeconds
  const updatedAt = new Date().toISOString()

  if (profile) {
    const { error: updateError } = await client
      .from('profiles')
      .update({ total_practice_seconds: nextTotal, updated_at: updatedAt })
      .eq('id', userId)

    if (updateError) {
      throw new Error(updateError.message)
    }
    return
  }

  const {
    data: { user },
  } = await client.auth.getUser()
  const email = user?.email
  if (!email) {
    return
  }

  const { error: insertError } = await client.from('profiles').insert({
    id: userId,
    email,
    total_practice_seconds: nextTotal,
    updated_at: updatedAt,
  })

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function finalizePracticeAttempt(
  attemptId: string,
  userId: string,
  status: 'completed' | 'abandoned',
  snapshot: FinalizeAttemptSnapshot,
): Promise<PracticeAttemptRow> {
  const durationSeconds = computeDurationSeconds(
    snapshot.sessionMinutesPlanned,
    snapshot.remainingSeconds,
  )
  const endedAt = new Date().toISOString()
  const sourceStatuses =
    status === 'completed' ? (['in_progress', 'abandoned'] as const) : (['in_progress'] as const)

  const client = requireSupabase()

  const { data: before, error: beforeError } = await client
    .from('practice_attempts')
    .select('status')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (beforeError) {
    throw new Error(beforeError.message)
  }
  if (!before) {
    throw new Error('Practice session not found.')
  }
  if (before.status === status) {
    const { data: existing, error: fetchError } = await client
      .from('practice_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .maybeSingle()
    if (fetchError) throw new Error(fetchError.message)
    if (!existing) throw new Error('Practice session not found.')
    return mapAttemptRow(existing)
  }

  const { data, error } = await client
    .from('practice_attempts')
    .update({
      status,
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      code: snapshot.code,
      language: snapshot.language,
      tests_passed: snapshot.testsPassed,
      tests_total: snapshot.testsTotal,
      all_tests_passed: snapshot.allTestsPassed,
      hidden_passed: snapshot.hiddenPassed ?? null,
      hidden_total: snapshot.hiddenTotal ?? null,
      hints_used: snapshot.hintsUsed,
      transcript: snapshot.transcript,
      updated_at: endedAt,
    })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .in('status', [...sourceStatuses])
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    if (before.status === 'in_progress') {
      await incrementTotalPracticeSeconds(userId, durationSeconds)
    }
    return mapAttemptRow(data)
  }

  const { data: existing, error: fetchError } = await client
    .from('practice_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }
  if (!existing) {
    throw new Error('Practice session not found.')
  }
  if (existing.status === 'in_progress') {
    throw new Error('Could not finalize practice session.')
  }
  if (status === 'completed' && existing.status !== 'completed') {
    throw new Error('Session could not be marked as submitted. Please try again.')
  }

  return mapAttemptRow(existing)
}

function mapAttemptRow(row: Record<string, unknown>): PracticeAttemptRow {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    status: row.status as AttemptStatus,
    question_slug: row.question_slug as string,
    question_title: row.question_title as string,
    difficulty: row.difficulty as Difficulty,
    category: row.category as string,
    session_minutes_planned: row.session_minutes_planned as number,
    started_at: row.started_at as string,
    ended_at: (row.ended_at as string | null) ?? null,
    duration_seconds: (row.duration_seconds as number | null) ?? null,
    code: (row.code as string | null) ?? null,
    language: (row.language as string | null) ?? null,
    tests_passed: (row.tests_passed as number | null) ?? null,
    tests_total: (row.tests_total as number | null) ?? null,
    all_tests_passed: (row.all_tests_passed as boolean | null) ?? null,
    hidden_passed: (row.hidden_passed as number | null) ?? null,
    hidden_total: (row.hidden_total as number | null) ?? null,
    hints_used: (row.hints_used as number) ?? 0,
    transcript: Array.isArray(row.transcript)
      ? (row.transcript as { role: string; text: string }[])
      : [],
  }
}

function mapFeedbackRow(row: Record<string, unknown>): AttemptFeedbackRow {
  return {
    attempt_id: row.attempt_id as string,
    overall_score: row.overall_score as number,
    recommendation: row.recommendation as FeedbackRecommendation,
    headline: row.headline as string,
    feedback: row.feedback as InterviewFeedbackResult,
    created_at: row.created_at as string,
  }
}

export async function getPracticeAttempt(
  attemptId: string,
  userId: string,
): Promise<PracticeAttemptWithFeedback | null> {
  const client = requireSupabase()
  const { data: attempt, error } = await client
    .from('practice_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!attempt) return null

  const { data: feedbackRow, error: feedbackError } = await client
    .from('attempt_feedback')
    .select('*')
    .eq('attempt_id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (feedbackError) {
    throw new Error(feedbackError.message)
  }

  return {
    ...mapAttemptRow(attempt as Record<string, unknown>),
    attempt_feedback: feedbackRow
      ? mapFeedbackRow(feedbackRow as Record<string, unknown>)
      : null,
  }
}

export async function listPracticeAttempts(userId: string): Promise<PracticeAttemptWithFeedback[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('practice_attempts')
    .select('*, attempt_feedback(*)')
    .eq('user_id', userId)
    .in('status', ['completed', 'abandoned'])
    .order('started_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    const feedbackRaw = row.attempt_feedback
    const feedback =
      feedbackRaw && !Array.isArray(feedbackRaw)
        ? mapFeedbackRow(feedbackRaw as Record<string, unknown>)
        : Array.isArray(feedbackRaw) && feedbackRaw[0]
          ? mapFeedbackRow(feedbackRaw[0] as Record<string, unknown>)
          : null
    const { attempt_feedback: __, ...attempt } = row
    return {
      ...mapAttemptRow(attempt as Record<string, unknown>),
      attempt_feedback: feedback,
    }
  })
}

export function groupCompletedAttemptsByQuestion(
  attempts: PracticeAttemptWithFeedback[],
): QuestionAttemptGroup[] {
  const completed = attempts.filter((a) => a.status === 'completed')
  const bySlug = new Map<string, QuestionAttemptGroup>()

  for (const attempt of completed) {
    const existing = bySlug.get(attempt.question_slug)
    if (existing) {
      existing.attempts.push(attempt)
    } else {
      bySlug.set(attempt.question_slug, {
        questionSlug: attempt.question_slug,
        questionTitle: attempt.question_title,
        difficulty: attempt.difficulty,
        category: attempt.category,
        attempts: [attempt],
      })
    }
  }

  for (const group of bySlug.values()) {
    group.attempts.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    )
  }

  return [...bySlug.values()].sort(
    (a, b) =>
      new Date(b.attempts[0]?.started_at ?? 0).getTime() -
      new Date(a.attempts[0]?.started_at ?? 0).getTime(),
  )
}

export function listAbandonedAttempts(
  attempts: PracticeAttemptWithFeedback[],
): PracticeAttemptRow[] {
  return attempts
    .filter((a) => a.status === 'abandoned')
    .map(({ attempt_feedback: _, ...row }) => row)
}

export async function saveAttemptFeedback(
  attemptId: string,
  userId: string,
  result: InterviewFeedbackResult,
): Promise<void> {
  const client = requireSupabase()
  const { error } = await client.from('attempt_feedback').upsert(
    {
      attempt_id: attemptId,
      user_id: userId,
      overall_score: result.overallScore,
      recommendation: result.recommendation,
      headline: result.headline,
      feedback: result,
    },
    { onConflict: 'attempt_id' },
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function getTotalPracticeSeconds(userId: string): Promise<number> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('total_practice_seconds')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return Number(data?.total_practice_seconds ?? 0)
}

export function buildFeedbackRequestFromAttempt(
  attempt: PracticeAttemptRow,
  questionDescription: string,
  constraints?: string[],
): InterviewFeedbackRequest {
  const minutesUsed = attempt.duration_seconds
    ? Math.max(1, Math.round(attempt.duration_seconds / 60))
    : attempt.session_minutes_planned

  return {
    question: {
      title: attempt.question_title,
      description: questionDescription,
      difficulty: attempt.difficulty,
      category: attempt.category,
      constraints,
    },
    code: {
      source: attempt.code ?? '',
      language: attempt.language ?? 'python',
    },
    tests: {
      passed: attempt.tests_passed ?? 0,
      total: attempt.tests_total ?? 0,
      allPassed: attempt.all_tests_passed ?? false,
      hiddenPassed: attempt.hidden_passed ?? undefined,
      hiddenTotal: attempt.hidden_total ?? undefined,
    },
    transcript: attempt.transcript.map((t) => ({
      role: t.role as 'interviewer' | 'candidate' | 'hint',
      text: t.text,
    })),
    session: {
      minutesTotal: attempt.session_minutes_planned,
      minutesUsed,
      hintsUsed: attempt.hints_used,
    },
  }
}

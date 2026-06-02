import type { CodeLanguage } from '../data/languages'

const MIC_KEY_PREFIX = 'prepify:mic-device:'
const ATTEMPT_LOCAL_PREFIX = 'prepify:attempt-local:'
const QUESTION_DRAFT_PREFIX = 'prepify:practice-draft:'
const RESTART_REQUEST_PREFIX = 'prepify:restart-request:'

export interface AttemptLocalState {
  userTestMode: boolean
  customTestCases: { id: string; input: string; output: string }[]
  codeByLanguage: Partial<Record<CodeLanguage, string>>
}

export interface QuestionPracticeDraft {
  attemptId: string | null
  questionSlug: string
  sessionMinutes: number
  userTestMode: boolean
  language: CodeLanguage
  codeByLanguage: Partial<Record<CodeLanguage, string>>
  remainingSeconds: number
  customTestCases: { id: string; input: string; output: string }[]
  updatedAt: number
}

function micKey(userId: string) {
  return `${MIC_KEY_PREFIX}${userId}`
}

function attemptLocalKey(attemptId: string) {
  return `${ATTEMPT_LOCAL_PREFIX}${attemptId}`
}

function questionDraftKey(userId: string, questionSlug: string) {
  return `${QUESTION_DRAFT_PREFIX}${userId}:${questionSlug}`
}

export function getStoredMicDeviceId(userId: string): string {
  try {
    return localStorage.getItem(micKey(userId)) ?? ''
  } catch {
    return ''
  }
}

export function setStoredMicDeviceId(userId: string, deviceId: string) {
  try {
    if (deviceId) {
      localStorage.setItem(micKey(userId), deviceId)
    } else {
      localStorage.removeItem(micKey(userId))
    }
  } catch {
    // ignore quota / private mode
  }
}

export function readQuestionDraft(
  userId: string,
  questionSlug: string,
): QuestionPracticeDraft | null {
  try {
    const raw = localStorage.getItem(questionDraftKey(userId, questionSlug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuestionPracticeDraft
    if (parsed.questionSlug !== questionSlug) return null
    if (!parsed.codeByLanguage || typeof parsed.codeByLanguage !== 'object') return null
    return {
      attemptId: parsed.attemptId ?? null,
      questionSlug: parsed.questionSlug,
      sessionMinutes: Number(parsed.sessionMinutes) || 45,
      userTestMode: Boolean(parsed.userTestMode),
      language: (parsed.language as CodeLanguage) ?? 'python',
      codeByLanguage: parsed.codeByLanguage,
      remainingSeconds: Number(parsed.remainingSeconds) || 0,
      customTestCases: Array.isArray(parsed.customTestCases) ? parsed.customTestCases : [],
      updatedAt: Number(parsed.updatedAt) || 0,
    }
  } catch {
    return null
  }
}

/** Synchronous save — call on every code edit so refresh never loses work. */
export function writeQuestionDraft(userId: string, draft: QuestionPracticeDraft) {
  try {
    localStorage.setItem(
      questionDraftKey(userId, draft.questionSlug),
      JSON.stringify({ ...draft, updatedAt: Date.now() }),
    )
  } catch {
    // ignore
  }
}

export function clearQuestionDraft(userId: string, questionSlug: string) {
  try {
    localStorage.removeItem(questionDraftKey(userId, questionSlug))
  } catch {
    // ignore
  }
}

export function readAttemptLocalState(attemptId: string): AttemptLocalState | null {
  try {
    const raw = localStorage.getItem(attemptLocalKey(attemptId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AttemptLocalState
    return {
      userTestMode: Boolean(parsed.userTestMode),
      customTestCases: Array.isArray(parsed.customTestCases) ? parsed.customTestCases : [],
      codeByLanguage:
        parsed.codeByLanguage && typeof parsed.codeByLanguage === 'object'
          ? parsed.codeByLanguage
          : {},
    }
  } catch {
    return null
  }
}

export function writeAttemptLocalState(attemptId: string, state: AttemptLocalState) {
  try {
    localStorage.setItem(attemptLocalKey(attemptId), JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function clearAttemptLocalState(attemptId: string) {
  try {
    localStorage.removeItem(attemptLocalKey(attemptId))
  } catch {
    // ignore
  }
}

export function isDraftRecent(draft: QuestionPracticeDraft, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return draft.updatedAt > Date.now() - maxAgeMs
}

function restartRequestKey(userId: string, questionSlug: string) {
  return `${RESTART_REQUEST_PREFIX}${userId}:${questionSlug}`
}

/** Set before abandoning a session so a reload cannot resume the old attempt. */
export function markRestartRequested(userId: string, questionSlug: string) {
  try {
    sessionStorage.setItem(restartRequestKey(userId, questionSlug), String(Date.now()))
  } catch {
    // ignore
  }
}

export function consumeRestartRequested(userId: string, questionSlug: string): boolean {
  try {
    const key = restartRequestKey(userId, questionSlug)
    if (!sessionStorage.getItem(key)) return false
    sessionStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function hasDraftCode(draft: QuestionPracticeDraft, questionStarterCode: string): boolean {
  return Object.values(draft.codeByLanguage).some(
    (source) => typeof source === 'string' && source.trim() !== '' && source !== questionStarterCode,
  )
}

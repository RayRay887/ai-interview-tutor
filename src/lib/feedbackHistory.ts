import type { InterviewFeedbackResult } from '../types/feedback'
import type { Difficulty } from '../data/questions'

export interface FeedbackHistoryEntry {
  slug: string
  title: string
  difficulty: Difficulty
  category: string
  timestamp: number
  overallScore: number
  recommendation: InterviewFeedbackResult['recommendation']
  headline: string
  feedback: InterviewFeedbackResult
}

interface FeedbackHistoryStore {
  entries: FeedbackHistoryEntry[]
}

const STORAGE_PREFIX = 'prepify:feedback-history:'
const MAX_ENTRIES = 30
export const FEEDBACK_HISTORY_UPDATED = 'prepify:feedback-history-updated'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function readStore(userId: string): FeedbackHistoryStore {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { entries: [] }
    const parsed = JSON.parse(raw) as FeedbackHistoryStore
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] }
  } catch {
    return { entries: [] }
  }
}

function writeStore(userId: string, store: FeedbackHistoryStore) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(FEEDBACK_HISTORY_UPDATED, { detail: { userId } }))
}

export function saveFeedbackHistory(
  userId: string,
  question: { slug: string; title: string; difficulty: Difficulty; category: string },
  feedback: InterviewFeedbackResult,
) {
  const store = readStore(userId)
  const entry: FeedbackHistoryEntry = {
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    category: question.category,
    timestamp: Date.now(),
    overallScore: feedback.overallScore,
    recommendation: feedback.recommendation,
    headline: feedback.headline,
    feedback,
  }

  store.entries = [entry, ...store.entries.filter((e) => e.slug !== question.slug)].slice(
    0,
    MAX_ENTRIES,
  )
  writeStore(userId, store)
}

export function getFeedbackHistory(userId: string): FeedbackHistoryEntry[] {
  return readStore(userId).entries
}

export function getLatestFeedbackForQuestion(
  userId: string,
  slug: string,
): FeedbackHistoryEntry | undefined {
  return readStore(userId).entries.find((entry) => entry.slug === slug)
}

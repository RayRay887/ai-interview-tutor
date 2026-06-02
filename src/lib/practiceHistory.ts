import type { Difficulty, Question } from '../data/questions'

export interface PracticeHistoryEntry {
  slug: string
  title: string
  difficulty: Difficulty
  category: string
  timestamp: number
}

interface PracticeHistoryStore {
  opened: PracticeHistoryEntry[]
  completed: PracticeHistoryEntry[]
}

const STORAGE_PREFIX = 'prepify:practice-history:'
const MAX_ENTRIES = 20
export const PRACTICE_HISTORY_UPDATED = 'prepify:practice-history-updated'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function readStore(userId: string): PracticeHistoryStore {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { opened: [], completed: [] }

    const parsed = JSON.parse(raw) as PracticeHistoryStore
    return {
      opened: Array.isArray(parsed.opened) ? parsed.opened : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    }
  } catch {
    return { opened: [], completed: [] }
  }
}

function writeStore(userId: string, store: PracticeHistoryStore) {
  localStorage.setItem(storageKey(userId), JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(PRACTICE_HISTORY_UPDATED, { detail: { userId } }))
}

function toEntry(question: Question, timestamp: number): PracticeHistoryEntry {
  return {
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    category: question.category,
    timestamp,
  }
}

function upsertEntry(
  entries: PracticeHistoryEntry[],
  entry: PracticeHistoryEntry,
): PracticeHistoryEntry[] {
  const without = entries.filter((item) => item.slug !== entry.slug)
  return [entry, ...without].slice(0, MAX_ENTRIES)
}

export function recordQuestionOpened(userId: string, question: Question) {
  const store = readStore(userId)
  store.opened = upsertEntry(store.opened, toEntry(question, Date.now()))
  writeStore(userId, store)
}

export function recordQuestionCompleted(userId: string, question: Question) {
  const store = readStore(userId)
  const entry = toEntry(question, Date.now())
  store.completed = upsertEntry(store.completed, entry)
  store.opened = upsertEntry(store.opened, entry)
  writeStore(userId, store)
}

export function getPracticeHistory(userId: string): PracticeHistoryStore {
  return readStore(userId)
}

export function formatHistoryDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

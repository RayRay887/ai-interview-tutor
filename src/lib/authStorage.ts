export interface StoredUser {
  id: string
  name: string
  email: string
  password: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
}

const USERS_KEY = 'prepify_users'
const SESSION_KEY = 'prepify_session'

export function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function setSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

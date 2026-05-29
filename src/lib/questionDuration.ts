export const MIN_SESSION_MINUTES = 10

export function parseQuestionDurationMinutes(duration: string): number {
  const match = duration.match(/(\d+)/)
  const minutes = match ? Number.parseInt(match[1], 10) : MIN_SESSION_MINUTES
  return Number.isFinite(minutes) ? minutes : MIN_SESSION_MINUTES
}

export function minutesToSeconds(minutes: number): number {
  return minutes * 60
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function clampSessionMinutes(minutes: number): number {
  return Math.max(MIN_SESSION_MINUTES, Math.floor(minutes))
}

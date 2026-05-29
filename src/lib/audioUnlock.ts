/** Call once from a click handler so later Audio.play() is allowed by the browser. */
export async function unlockAudioPlayback(): Promise<void> {
  if (!('Audio' in window)) return

  const audio = new Audio(
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQAAAAA=',
  )
  audio.volume = 0.001

  try {
    await audio.play()
    audio.pause()
  } catch {
    // Ignore — user may still need to click Play introduction
  }
}

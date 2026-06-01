import { useCallback, useEffect, useRef, useState } from 'react'
import { requestSpeechAudio } from '../lib/interviewApi'

let activeAudio: HTMLAudioElement | null = null
let activeObjectUrl: string | null = null
let speakGeneration = 0

/** Stop any in-flight or playing interviewer audio (e.g. when leaving practice). */
export function stopAllInterviewAudio() {
  speakGeneration += 1
  stopActiveAudio()
}

function stopActiveAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio.onended = null
    activeAudio.onerror = null
    activeAudio = null
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl)
    activeObjectUrl = null
  }
}

function playBlob(blob: Blob, generation: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (generation !== speakGeneration) {
      resolve()
      return
    }

    stopActiveAudio()

    const url = URL.createObjectURL(blob)
    activeObjectUrl = url
    const audio = new Audio(url)
    activeAudio = audio
    audio.volume = 1

    audio.onended = () => {
      if (generation !== speakGeneration) return
      stopActiveAudio()
      resolve()
    }

    audio.onerror = () => {
      if (generation !== speakGeneration) return
      stopActiveAudio()
      reject(new Error('Failed to play audio.'))
    }

    void audio.play().catch((error: unknown) => {
      if (generation !== speakGeneration) return
      stopActiveAudio()
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError') {
        reject(
          new Error(
            'Your browser blocked autoplay. Click "Play introduction" below to hear your tutor.',
          ),
        )
        return
      }
      reject(error instanceof Error ? error : new Error('Failed to play audio.'))
    })
  })
}

export function useInterviewerTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [playBlocked, setPlayBlocked] = useState(false)
  const pendingBlobRef = useRef<Blob | null>(null)

  const stop = useCallback(() => {
    stopAllInterviewAudio()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const generation = ++speakGeneration
    setPlayBlocked(false)
    setIsSpeaking(true)

    try {
      const blob = await requestSpeechAudio(trimmed)
      if (generation !== speakGeneration) return

      pendingBlobRef.current = blob
      await playBlob(blob, generation)

      if (generation !== speakGeneration) return
      pendingBlobRef.current = null
      setPlayBlocked(false)
    } catch (error) {
      if (generation !== speakGeneration) return
      if (
        error instanceof Error &&
        error.message.includes('Play introduction')
      ) {
        setPlayBlocked(true)
      }
      throw error
    } finally {
      if (generation === speakGeneration) {
        setIsSpeaking(false)
      }
    }
  }, [])

  const playPending = useCallback(async () => {
    const blob = pendingBlobRef.current
    if (!blob) return

    const generation = ++speakGeneration
    setIsSpeaking(true)
    setPlayBlocked(false)

    try {
      await playBlob(blob, generation)
      if (generation !== speakGeneration) return
      pendingBlobRef.current = null
    } finally {
      if (generation === speakGeneration) {
        setIsSpeaking(false)
      }
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  return { speak, stop, isSpeaking, playBlocked, playPending, hasPendingAudio: playBlocked }
}

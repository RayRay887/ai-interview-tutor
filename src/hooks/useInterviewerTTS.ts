import { useCallback, useEffect, useRef, useState } from 'react'
import { requestSpeechAudio } from '../lib/interviewApi'

let activeAudio: HTMLAudioElement | null = null
let activeObjectUrl: string | null = null
let speakGeneration = 0
let activePlaybackResolve: (() => void) | null = null

/** Stop any in-flight or playing interviewer audio (e.g. when leaving practice). */
export function stopAllInterviewAudio() {
  speakGeneration += 1
  stopActiveAudio()
  activePlaybackResolve?.()
  activePlaybackResolve = null
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

function playBlobInternal(blob: Blob, generation: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (generation !== speakGeneration) {
      resolve()
      return
    }

    stopActiveAudio()
    activePlaybackResolve = () => resolve()

    const url = URL.createObjectURL(blob)
    activeObjectUrl = url
    const audio = new Audio(url)
    activeAudio = audio
    audio.volume = 1

    const finish = () => {
      if (generation !== speakGeneration) return
      activePlaybackResolve = null
      stopActiveAudio()
      resolve()
    }

    audio.onended = finish

    audio.onerror = () => {
      if (generation !== speakGeneration) return
      activePlaybackResolve = null
      stopActiveAudio()
      reject(new Error('Failed to play audio.'))
    }

    void audio.play().catch((error: unknown) => {
      if (generation !== speakGeneration) return
      activePlaybackResolve = null
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

  const prefetchSpeech = useCallback(async (text: string): Promise<Blob> => {
    const trimmed = text.trim()
    if (!trimmed) {
      throw new Error('No text to speak.')
    }
    return requestSpeechAudio(trimmed)
  }, [])

  const playSpeechBlob = useCallback(async (blob: Blob) => {
    const generation = ++speakGeneration
    setPlayBlocked(false)
    setIsSpeaking(true)

    try {
      pendingBlobRef.current = blob
      await playBlobInternal(blob, generation)
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

  const speak = useCallback(
    async (text: string) => {
      const blob = await prefetchSpeech(text)
      await playSpeechBlob(blob)
    },
    [prefetchSpeech, playSpeechBlob],
  )

  const playPending = useCallback(async () => {
    const blob = pendingBlobRef.current
    if (!blob) return
    await playSpeechBlob(blob)
  }, [playSpeechBlob])

  useEffect(() => () => stop(), [stop])

  return {
    speak,
    prefetchSpeech,
    playSpeechBlob,
    stop,
    isSpeaking,
    playBlocked,
    playPending,
    hasPendingAudio: playBlocked,
  }
}

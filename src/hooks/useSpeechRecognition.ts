import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionOptions {
  enabled: boolean
  onUtterance: (text: string) => void
  language?: string
  flushDelayMs?: number
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition({
  enabled,
  onUtterance,
  language = 'en-US',
  flushDelayMs = 1200,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported] = useState(() => getSpeechRecognition() !== null)

  const onUtteranceRef = useRef(onUtterance)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pendingRef = useRef('')
  const flushTimerRef = useRef<number | null>(null)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    onUtteranceRef.current = onUtterance
  }, [onUtterance])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
  }, [])

  const flushPending = useCallback(() => {
    clearFlushTimer()
    const text = pendingRef.current.trim()
    pendingRef.current = ''
    setInterimTranscript('')
    if (text.length >= 2) {
      onUtteranceRef.current(text)
    }
  }, [clearFlushTimer])

  const scheduleFlush = useCallback(() => {
    clearFlushTimer()
    flushTimerRef.current = window.setTimeout(flushPending, flushDelayMs)
  }, [clearFlushTimer, flushDelayMs, flushPending])

  const stop = useCallback(() => {
    clearFlushTimer()
    pendingRef.current = ''
    setInterimTranscript('')
    setIsListening(false)
    recognitionRef.current?.stop()
  }, [clearFlushTimer])

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition || !enabledRef.current) return

    recognitionRef.current?.abort()

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          pendingRef.current += transcript
          scheduleFlush()
        } else {
          interim += transcript
        }
      }
      setInterimTranscript(interim.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      if (!enabledRef.current) {
        setIsListening(false)
        return
      }
      try {
        recognition.start()
      } catch {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }, [language, scheduleFlush])

  useEffect(() => {
    if (enabled && isSupported) {
      start()
      return () => {
        enabledRef.current = false
        recognitionRef.current?.abort()
        clearFlushTimer()
        setIsListening(false)
      }
    }

    stop()
    return undefined
  }, [enabled, isSupported, start, stop, clearFlushTimer])

  return { isListening, interimTranscript, isSupported, stop, start }
}

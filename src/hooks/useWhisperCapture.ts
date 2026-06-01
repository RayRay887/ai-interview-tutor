import { useCallback, useEffect, useRef, useState } from 'react'
import { requestTranscription, TranscriptionError } from '../lib/interviewApi'

interface UseWhisperCaptureOptions {
  /** Keep the mic stream open for the session. */
  active: boolean
  /** When false, stream stays open but end-of-speech detection is paused. */
  vadEnabled: boolean
  deviceId: string
  onUtterance: (text: string) => void
  onError?: (message: string) => void
  onMicLost?: () => void
  silenceMs?: number
  minSpeechMs?: number
  maxUtteranceMs?: number
}

const SPEECH_ON_THRESHOLD = 0.018
const SPEECH_OFF_THRESHOLD = 0.011
const QUIET_FRAMES_TO_END_SPEECH = 10

function closeAudioContext(ctx: AudioContext | null) {
  if (!ctx || ctx.state === 'closed') return
  void ctx.close().catch(() => undefined)
}

function adaptiveSilenceMs(turnDurationMs: number, baseSilenceMs: number): number {
  const base =
    turnDurationMs < 6000 ? Math.min(baseSilenceMs, 1600) : baseSilenceMs
  if (turnDurationMs < 4000) return base
  if (turnDurationMs < 12000) return base + 800
  if (turnDurationMs < 25000) return base + 1600
  return base + 2400
}

export function useWhisperCapture({
  active,
  vadEnabled,
  deviceId,
  onUtterance,
  onError,
  onMicLost,
  silenceMs = 2800,
  minSpeechMs = 400,
  maxUtteranceMs = 45000,
}: UseWhisperCaptureOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined',
  )

  const onUtteranceRef = useRef(onUtterance)
  const onErrorRef = useRef(onError)
  const onMicLostRef = useRef(onMicLost)
  const activeRef = useRef(active)
  const vadEnabledRef = useRef(vadEnabled)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const speechStartRef = useRef<number | null>(null)
  const hadSpeechRef = useRef(false)
  const inSpeechZoneRef = useRef(false)
  const quietStreakRef = useRef(0)
  const processingRef = useRef(false)
  const mimeTypeRef = useRef('audio/webm')
  const silenceMsRef = useRef(silenceMs)
  const minSpeechMsRef = useRef(minSpeechMs)
  const maxUtteranceMsRef = useRef(maxUtteranceMs)

  useEffect(() => {
    onUtteranceRef.current = onUtterance
  }, [onUtterance])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onMicLostRef.current = onMicLost
  }, [onMicLost])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    vadEnabledRef.current = vadEnabled
    if (!vadEnabled) {
      silenceStartRef.current = null
      speechStartRef.current = null
      hadSpeechRef.current = false
      inSpeechZoneRef.current = false
      quietStreakRef.current = 0
    }
  }, [vadEnabled])

  useEffect(() => {
    silenceMsRef.current = silenceMs
    minSpeechMsRef.current = minSpeechMs
    maxUtteranceMsRef.current = maxUtteranceMs
  }, [silenceMs, minSpeechMs, maxUtteranceMs])

  const resetSpeechMarkers = useCallback(() => {
    silenceStartRef.current = null
    speechStartRef.current = null
    hadSpeechRef.current = false
    inSpeechZoneRef.current = false
    quietStreakRef.current = 0
  }, [])

  const scheduleMonitor = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }
    rafRef.current = requestAnimationFrame(monitorLevelRef.current)
  }, [])

  const stopRecorder = useCallback((): Promise<void> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true })
      try {
        recorder.stop()
      } catch {
        resolve()
      }
    })
  }, [])

  const startRecorder = useCallback(() => {
    const stream = streamRef.current
    if (!stream || !activeRef.current) return

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }
    recorder.start(250)
  }, [])

  const flushUtterance = useCallback(async () => {
    if (processingRef.current || !vadEnabledRef.current) return
    if (!hadSpeechRef.current && chunksRef.current.length === 0) return

    processingRef.current = true
    await stopRecorder()

    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
    chunksRef.current = []
    resetSpeechMarkers()

    try {
      if (blob.size > 0) {
        const whisperStart = performance.now()
        const text = await requestTranscription(blob)
        if (import.meta.env.DEV) {
          console.debug('[voice-turn] whisperMs', Math.round(performance.now() - whisperStart))
        }
        if (text.trim().length >= 2) {
          onUtteranceRef.current(text.trim())
        }
      }
    } catch (error) {
      const message =
        error instanceof TranscriptionError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not transcribe your speech.'
      onErrorRef.current?.(message)
    } finally {
      processingRef.current = false
      if (activeRef.current && streamRef.current) {
        startRecorder()
        scheduleMonitor()
      }
    }
  }, [resetSpeechMarkers, scheduleMonitor, startRecorder, stopRecorder])

  const monitorLevelRef = useRef<() => void>(() => undefined)

  monitorLevelRef.current = () => {
    const analyser = analyserRef.current
    if (!analyser || !activeRef.current) {
      rafRef.current = null
      return
    }

    if (!vadEnabledRef.current || processingRef.current) {
      rafRef.current = requestAnimationFrame(monitorLevelRef.current)
      return
    }

    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)

    let sum = 0
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length)
    const now = Date.now()

    if (rms >= SPEECH_ON_THRESHOLD) {
      inSpeechZoneRef.current = true
      quietStreakRef.current = 0
      silenceStartRef.current = null
    } else if (rms < SPEECH_OFF_THRESHOLD) {
      quietStreakRef.current += 1
      if (quietStreakRef.current >= QUIET_FRAMES_TO_END_SPEECH) {
        inSpeechZoneRef.current = false
      }
    }

    const speaking = inSpeechZoneRef.current

    if (speaking) {
      hadSpeechRef.current = true
      speechStartRef.current ??= now

      const turnDurationMs = now - (speechStartRef.current ?? now)
      if (turnDurationMs >= maxUtteranceMsRef.current) {
        void flushUtterance()
      }
    } else if (hadSpeechRef.current) {
      silenceStartRef.current ??= now
      const silentFor = now - (silenceStartRef.current ?? now)
      const turnDurationMs = now - (speechStartRef.current ?? now)
      const speechBeforePauseMs =
        (silenceStartRef.current ?? now) - (speechStartRef.current ?? now)
      const requiredSilence = adaptiveSilenceMs(turnDurationMs, silenceMsRef.current)

      if (
        silentFor >= requiredSilence &&
        speechBeforePauseMs >= minSpeechMsRef.current
      ) {
        void flushUtterance()
      }
    }

    rafRef.current = requestAnimationFrame(monitorLevelRef.current)
  }

  const cleanupStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    void stopRecorder()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    analyserRef.current = null
    closeAudioContext(audioContextRef.current)
    audioContextRef.current = null
    chunksRef.current = []
    resetSpeechMarkers()
    setIsListening(false)
  }, [resetSpeechMarkers, stopRecorder])

  const start = useCallback(async () => {
    if (!isSupported || !activeRef.current || !deviceId) return
    if (streamRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      streamRef.current = stream

      const track = stream.getAudioTracks()[0]
      if (track) {
        track.onended = () => onMicLostRef.current?.()
      }

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      startRecorder()
      setIsListening(true)
      scheduleMonitor()
    } catch {
      cleanupStream()
      onErrorRef.current?.('Could not access the microphone.')
    }
  }, [cleanupStream, deviceId, isSupported, scheduleMonitor, startRecorder])

  const stop = useCallback(() => {
    cleanupStream()
  }, [cleanupStream])

  useEffect(() => {
    if (active && isSupported && deviceId) {
      void start()
      return () => stop()
    }
    stop()
    return undefined
  }, [active, isSupported, deviceId, start, stop])

  return {
    isListening,
    isSupported,
    stop,
    resumeAudioContext: async () => {
      const ctx = audioContextRef.current
      if (!ctx) return
      if (ctx.state === 'closed') return
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
    },
  }
}

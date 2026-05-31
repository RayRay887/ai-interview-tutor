import { useCallback, useEffect, useRef, useState } from 'react'
import { requestTranscription, TranscriptionError } from '../lib/interviewApi'

interface UseWhisperCaptureOptions {
  enabled: boolean
  deviceId: string
  onUtterance: (text: string) => void
  silenceMs?: number
  minSpeechMs?: number
}

const WHISPER_PROMPT_HINT =
  'Technical coding interview with algorithm and data structure vocabulary.'

export function useWhisperCapture({
  enabled,
  deviceId,
  onUtterance,
  silenceMs = 1200,
  minSpeechMs = 400,
}: UseWhisperCaptureOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined',
  )

  const onUtteranceRef = useRef(onUtterance)
  const enabledRef = useRef(enabled)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const speechStartRef = useRef<number | null>(null)
  const hadSpeechRef = useRef(false)
  const processingRef = useRef(false)

  useEffect(() => {
    onUtteranceRef.current = onUtterance
  }, [onUtterance])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const cleanupStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    recorderRef.current?.stop()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    analyserRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    chunksRef.current = []
    silenceStartRef.current = null
    speechStartRef.current = null
    hadSpeechRef.current = false
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const flushRecording = useCallback(async () => {
    if (processingRef.current || chunksRef.current.length === 0) return

    processingRef.current = true
    setIsTranscribing(true)
    setInterimTranscript('Transcribing…')

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []
    hadSpeechRef.current = false
    silenceStartRef.current = null
    speechStartRef.current = null

    try {
      const text = await requestTranscription(blob)
      setInterimTranscript('')
      if (text.trim().length >= 2) {
        onUtteranceRef.current(text.trim())
      }
    } catch (error) {
      if (error instanceof TranscriptionError) {
        setInterimTranscript('')
      }
    } finally {
      processingRef.current = false
      setIsTranscribing(false)
    }
  }, [])

  const monitorLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser || !enabledRef.current) return

    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)

    let sum = 0
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / data.length)
    const now = Date.now()
    const speaking = rms > 0.02

    if (speaking) {
      hadSpeechRef.current = true
      speechStartRef.current ??= now
      silenceStartRef.current = null
      setInterimTranscript('Listening…')
    } else if (hadSpeechRef.current) {
      silenceStartRef.current ??= now
      const silentFor = now - (silenceStartRef.current ?? now)
      const spokeFor = (silenceStartRef.current ?? now) - (speechStartRef.current ?? now)

      if (silentFor >= silenceMs && spokeFor >= minSpeechMs) {
        void flushRecording()
        return
      }
    }

    rafRef.current = requestAnimationFrame(monitorLevel)
  }, [flushRecording, minSpeechMs, silenceMs])

  const start = useCallback(async () => {
    if (!isSupported || !enabledRef.current || !deviceId) return

    cleanupStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.start(250)
      setIsListening(true)
      rafRef.current = requestAnimationFrame(monitorLevel)
    } catch {
      cleanupStream()
    }
  }, [cleanupStream, deviceId, isSupported, monitorLevel])

  const stop = useCallback(() => {
    cleanupStream()
  }, [cleanupStream])

  useEffect(() => {
    if (enabled && isSupported && deviceId) {
      void start()
      return () => stop()
    }
    stop()
    return undefined
  }, [enabled, isSupported, deviceId, start, stop])

  return {
    isListening,
    isTranscribing,
    interimTranscript,
    isSupported,
    stop,
    promptHint: WHISPER_PROMPT_HINT,
  }
}

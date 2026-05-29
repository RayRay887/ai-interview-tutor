import { Mic, Play, Square, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface MicrophoneSetupModalProps {
  onConfirm: (deviceId: string) => void
}

function isVirtualDeviceId(deviceId: string) {
  return deviceId === 'default' || deviceId === 'communications'
}

function normalizeMicLabel(label: string) {
  return label
    .replace(/^Default\s*-\s*/i, '')
    .replace(/^Communications\s*-\s*/i, '')
    .trim()
}

function getUniqueMicrophones(devices: MediaDeviceInfo[]) {
  const inputs = devices.filter((device) => device.kind === 'audioinput' && device.deviceId)
  const byGroup = new Map<string, MediaDeviceInfo>()

  for (const device of inputs) {
    const key = device.groupId || device.deviceId
    const current = byGroup.get(key)

    if (!current) {
      byGroup.set(key, device)
      continue
    }

    if (isVirtualDeviceId(current.deviceId) && !isVirtualDeviceId(device.deviceId)) {
      byGroup.set(key, device)
      continue
    }

    if (!current.label && device.label) {
      byGroup.set(key, device)
    }
  }

  const grouped = [...byGroup.values()]
  const byLabel = new Map<string, MediaDeviceInfo>()

  for (const device of grouped) {
    const labelKey = normalizeMicLabel(device.label || device.deviceId).toLowerCase()
    const current = byLabel.get(labelKey)

    if (!current) {
      byLabel.set(labelKey, device)
      continue
    }

    if (isVirtualDeviceId(current.deviceId) && !isVirtualDeviceId(device.deviceId)) {
      byLabel.set(labelKey, device)
    }
  }

  return [...byLabel.values()]
}

function getMicrophoneLabel(device: MediaDeviceInfo) {
  const cleaned = normalizeMicLabel(device.label)
  if (cleaned) return cleaned
  return `Microphone ${device.deviceId.slice(0, 8)}`
}

export function MicrophoneSetupModal({ onConfirm }: MicrophoneSetupModalProps) {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasActiveStream, setHasActiveStream] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingUrlRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  const skipNextDeviceSwitchRef = useRef(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const levelFrameRef = useRef<number | null>(null)

  const stopStream = useCallback(() => {
    if (levelFrameRef.current !== null) {
      cancelAnimationFrame(levelFrameRef.current)
      levelFrameRef.current = null
    }
    analyserRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    setAudioLevel(0)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const refreshMicrophones = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = getUniqueMicrophones(devices)
    setMicrophones(audioInputs)

    if (audioInputs.length === 0) {
      setErrorMessage('No microphone detected. Connect a microphone and try again.')
      return false
    }

    setErrorMessage(null)
    setSelectedDeviceId((current) => {
      if (current && audioInputs.some((device) => device.deviceId === current)) {
        return current
      }
      return audioInputs[0].deviceId
    })
    return true
  }, [])

  const startMicrophone = useCallback(
    async (deviceId?: string) => {
      stopStream()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      })

      streamRef.current = stream
      setPermissionState('granted')
      setHasActiveStream(true)
      return refreshMicrophones()
    },
    [refreshMicrophones, stopStream],
  )

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setPermissionState('denied')
          setErrorMessage('Microphone access is not supported in this browser.')
          return
        }

        await startMicrophone()
        if (!cancelled) initializedRef.current = true
      } catch {
        if (!cancelled) {
          setPermissionState('denied')
          setErrorMessage('Microphone permission is required to start a practice session.')
        }
      }
    }

    void init()

    return () => {
      cancelled = true
      stopStream()
      recorderRef.current?.stop()
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [startMicrophone, stopStream])

  useEffect(() => {
    if (!initializedRef.current || !selectedDeviceId || permissionState !== 'granted') return
    if (skipNextDeviceSwitchRef.current) {
      skipNextDeviceSwitchRef.current = false
      return
    }

    const switchDevice = async () => {
      try {
        stopStream()
        setHasActiveStream(false)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDeviceId } },
        })
        streamRef.current = stream
        setHasActiveStream(true)
        setErrorMessage(null)
      } catch {
        setErrorMessage('Could not access the selected microphone.')
      }
    }

    void switchDevice()
  }, [permissionState, selectedDeviceId, stopStream])

  useEffect(() => {
    recordingUrlRef.current = recordingUrl
  }, [recordingUrl])

  useEffect(() => {
    if (!hasActiveStream || !streamRef.current) {
      setAudioLevel(0)
      return
    }

    const stream = streamRef.current
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.75

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    const samples = new Uint8Array(analyser.fftSize)

    const updateLevel = () => {
      analyser.getByteTimeDomainData(samples)

      let sumSquares = 0
      for (let i = 0; i < samples.length; i += 1) {
        const sample = (samples[i] - 128) / 128
        sumSquares += sample * sample
      }

      const rms = Math.sqrt(sumSquares / samples.length)
      const normalized = Math.min(100, Math.round(rms * 420))
      setAudioLevel(normalized)
      levelFrameRef.current = requestAnimationFrame(updateLevel)
    }

    void audioContext.resume().then(() => {
      levelFrameRef.current = requestAnimationFrame(updateLevel)
    })

    return () => {
      if (levelFrameRef.current !== null) {
        cancelAnimationFrame(levelFrameRef.current)
        levelFrameRef.current = null
      }
      source.disconnect()
      void audioContext.close()
      if (audioContextRef.current === audioContext) {
        audioContextRef.current = null
        analyserRef.current = null
      }
      setAudioLevel(0)
    }
  }, [hasActiveStream, selectedDeviceId])

  const handleRequestPermission = async () => {
    setErrorMessage(null)
    setPermissionState('pending')

    try {
      await startMicrophone(selectedDeviceId || undefined)
      initializedRef.current = true
    } catch {
      setPermissionState('denied')
      setErrorMessage('Microphone permission is required to start a practice session.')
    }
  }

  const handleRecord = () => {
    if (!streamRef.current || isRecording) return

    setRecordingUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })

    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(streamRef.current)
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      setRecordingUrl(URL.createObjectURL(blob))
      setIsRecording(false)
    }

    recorder.start()
    setIsRecording(true)
    window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, 3000)
  }

  const handlePlayback = async () => {
    if (!recordingUrl || isPlaying) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    const audio = new Audio(recordingUrl)
    audioRef.current = audio
    setIsPlaying(true)

    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => {
      setIsPlaying(false)
      setErrorMessage('Could not play back the recording.')
    }

    try {
      await audio.play()
    } catch {
      setIsPlaying(false)
      setErrorMessage('Could not play back the recording.')
    }
  }

  const handleConfirm = () => {
    stopStream()
    onConfirm(selectedDeviceId)
  }

  const canConfirm =
    permissionState === 'granted' && microphones.length > 0 && Boolean(selectedDeviceId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 p-4 backdrop-blur-sm">
      <div className="glass glow-blue w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/15">
            <Mic className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Set up your microphone</h2>
            <p className="text-sm text-text-secondary">
              Allow microphone access and test your audio before starting the session.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {permissionState === 'denied' && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {errorMessage ?? 'Microphone permission was denied.'}
            </div>
          )}

          {permissionState === 'pending' && (
            <p className="text-sm text-text-secondary">Checking microphone access...</p>
          )}

          {permissionState === 'granted' && (
            <>
              <div>
                <label htmlFor="microphone-select" className="mb-2 block text-xs font-medium text-text-secondary">
                  Microphone
                </label>
                <select
                  id="microphone-select"
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  disabled={microphones.length === 0}
                  className="w-full rounded-lg border border-white/10 bg-bg-primary/80 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue/40 disabled:opacity-60"
                >
                  {microphones.map((device) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-bg-secondary">
                      {getMicrophoneLabel(device)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                <p className="mb-3 text-xs font-medium tracking-wider text-text-secondary uppercase">
                  Test recording
                </p>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-[10px] text-text-secondary">
                    <span>Input level</span>
                    <span>{hasActiveStream ? `${audioLevel}%` : 'No signal'}</span>
                  </div>
                  <div className="relative h-4 overflow-hidden rounded-full border border-white/10 bg-bg-secondary/80">
                    <div className="absolute inset-0 flex">
                      <div className="h-full flex-[55] bg-emerald-500/35" />
                      <div className="h-full flex-[25] bg-amber-400/35" />
                      <div className="h-full flex-[20] bg-rose-500/35" />
                    </div>
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/25 transition-[width] duration-75 ease-out"
                      style={{ width: `${audioLevel}%` }}
                    />
                    <div
                      className={`absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.45)] transition-[left] duration-75 ease-out ${
                        audioLevel >= 80
                          ? 'bg-rose-400'
                          : audioLevel >= 55
                            ? 'bg-amber-300'
                            : 'bg-emerald-400'
                      }`}
                      style={{ left: `${Math.max(2, Math.min(98, audioLevel))}%` }}
                    />
                  </div>
                  <div className="relative mt-1.5 h-4 text-[10px] text-text-secondary/70">
                    <span className="absolute left-0 text-emerald-400/80">Quiet</span>
                    <span className="absolute left-[55%] -translate-x-1/2 text-amber-400/80">Good</span>
                    <span className="absolute right-0 text-rose-400/80">Loud</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRecord}
                    disabled={isRecording || !hasActiveStream}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-blue/20 px-3 py-2 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-3.5 w-3.5" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        Record 3s
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handlePlayback}
                    disabled={!recordingUrl || isPlaying}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isPlaying ? 'Playing...' : 'Play back'}
                  </button>
                </div>

                {recordingUrl && (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-400">
                    <Volume2 className="h-3.5 w-3.5" />
                    Test recording ready
                  </p>
                )}
              </div>

              {errorMessage && (
                <p className="text-sm text-rose-400">{errorMessage}</p>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
          {permissionState === 'denied' && (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
            >
              Try again
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-lg bg-linear-to-r from-accent-blue to-accent-purple px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-blue/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm & start
          </button>
        </div>
      </div>
    </div>
  )
}

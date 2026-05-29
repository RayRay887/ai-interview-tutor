import { useEffect, useRef } from 'react'

interface UseMicrophoneMonitorOptions {
  deviceId: string
  enabled: boolean
  onMicLost: () => void
}

export function useMicrophoneMonitor({
  deviceId,
  enabled,
  onMicLost,
}: UseMicrophoneMonitorOptions) {
  const onMicLostRef = useRef(onMicLost)

  useEffect(() => {
    onMicLostRef.current = onMicLost
  }, [onMicLost])

  useEffect(() => {
    if (!enabled || !deviceId) return

    let stream: MediaStream | null = null
    let pollId: number | null = null
    let cancelled = false
    let notified = false

    const notifyLost = () => {
      if (notified || cancelled) return
      notified = true
      onMicLostRef.current()
    }

    const verifyDeviceStillPresent = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const stillPresent = devices.some(
          (device) => device.kind === 'audioinput' && device.deviceId === deviceId,
        )
        if (!stillPresent) {
          notifyLost()
        }
      } catch {
        notifyLost()
      }
    }

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const track = stream.getAudioTracks()[0]
        if (!track) {
          notifyLost()
          return
        }

        track.onended = () => notifyLost()
        track.onmute = () => notifyLost()

        pollId = window.setInterval(() => {
          if (!track.enabled || track.readyState === 'ended' || track.muted) {
            notifyLost()
          }
        }, 800)
      } catch {
        notifyLost()
      }
    }

    void start()
    navigator.mediaDevices.addEventListener('devicechange', verifyDeviceStillPresent)

    return () => {
      cancelled = true
      if (pollId !== null) window.clearInterval(pollId)
      stream?.getTracks().forEach((track) => track.stop())
      navigator.mediaDevices.removeEventListener('devicechange', verifyDeviceStillPresent)
    }
  }, [deviceId, enabled])
}

export async function isMicrophoneAvailable(deviceId: string): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}

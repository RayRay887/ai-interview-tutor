import { useEffect, useRef } from 'react'

interface UseMicrophoneMonitorOptions {
  deviceId: string
  enabled: boolean
  onMicLost: () => void
}

/** Polls device list only — does not open a second mic stream (avoids conflicting with Whisper). */
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

    void verifyDeviceStillPresent()
    const pollId = window.setInterval(() => void verifyDeviceStillPresent(), 2000)
    navigator.mediaDevices.addEventListener('devicechange', verifyDeviceStillPresent)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
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

import type { InterviewQuestionContext } from '../types/interview'
import { supabase } from './supabase'

export interface TextToSpeechResponse {
  audioBase64: string
}

export class SpeechGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpeechGenerationError'
  }
}

/** Fixed opening line — spoken aloud, not shown as text in the UI. */
export function getSessionOpening(question: InterviewQuestionContext): string {
  return `Hi, I'm your AI tutor for today. Let's start with this question: ${question.title}. I'll give you two minutes to read it.`
}

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'audio/mpeg' })
}

async function fetchDevSpeech(text: string): Promise<Blob> {
  const response = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    let detail = `TTS server returned ${response.status}.`
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) detail = body.error
    } catch {
      // ignore
    }
    throw new SpeechGenerationError(
      `${detail} Restart \`npm run dev\` after adding OPENAI_API_KEY to .env.`,
    )
  }

  const data = (await response.json()) as TextToSpeechResponse
  if (!data.audioBase64) {
    throw new SpeechGenerationError('TTS server returned empty audio.')
  }

  return base64ToBlob(data.audioBase64)
}

async function fetchSupabaseSpeech(text: string): Promise<Blob | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase.functions.invoke<TextToSpeechResponse>('text-to-speech', {
      body: { text },
    })

    if (error || !data?.audioBase64) {
      return null
    }

    return base64ToBlob(data.audioBase64)
  } catch {
    return null
  }
}

export async function requestSpeechAudio(text: string): Promise<Blob> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new SpeechGenerationError('No text to speak.')
  }

  if (import.meta.env.DEV) {
    return fetchDevSpeech(trimmed)
  }

  const remote = await fetchSupabaseSpeech(trimmed)
  if (remote) return remote

  throw new SpeechGenerationError(
    'Deploy the text-to-speech Supabase function for production audio.',
  )
}

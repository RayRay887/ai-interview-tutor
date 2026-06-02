import type { InterviewMessageRole, InterviewQuestionContext } from '../types/interview'
import { getSessionOpeningFallback } from './interviewerSession'
import { isSupabaseConfigured, supabase } from './supabase'

export interface TextToSpeechResponse {
  audioBase64: string
}

export interface InterviewTurnMessage {
  role: InterviewMessageRole
  text: string
}

export interface InterviewTurnRequest {
  question: InterviewQuestionContext
  messages: InterviewTurnMessage[]
  userMessage?: string
  interviewerFirstName?: string
  code?: { source?: string; changedSinceLastTurn?: boolean; lineCount?: number }
  console?: { level: 'info' | 'success' | 'error' | 'warn'; message: string; line?: number }[]
  tests?: { passed: number; total: number; lastFailures?: string[] }
  session?: { language?: string; minutesRemaining?: number; phase?: string }
  signals?: {
    silenceSeconds?: number
    testsJustRun?: boolean
    candidateAskedForHint?: boolean
    approachClarity?: 'vague' | 'partial' | 'concrete'
    approachProbeCount?: number
  }
  hintState?: { levelUsed?: number }
}

export interface InterviewTurnResponse {
  reply: string
  role: 'interviewer' | 'hint'
}

export class SpeechGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpeechGenerationError'
  }
}

export class InterviewTurnError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterviewTurnError'
  }
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

export interface TranscriptionResponse {
  text: string
}

/** Normalize interviewer text before TTS — no fake fillers. */
export function prepareSpeechText(text: string): string {
  return text
    .replace(/[*_`#]/g, '')
    .replace(/\s—\s/g, ', ')
    .replace(/\s–\s/g, ', ')
    .replace(/\bO\s*\(\s*/gi, 'O of ')
    .replace(/\bO\(n\)/gi, 'O of n')
    .replace(/\bO\(n\s+log\s+n\)/gi, 'O of n log n')
    .replace(/\s+/g, ' ')
    .trim()
}

/** @deprecated Use requestSessionOpening — kept as offline fallback text only. */
export function getSessionOpening(question: InterviewQuestionContext): string {
  return getSessionOpeningFallback('Alex', question.title)
}

export async function requestSessionOpening(
  question: InterviewQuestionContext,
  interviewerFirstName: string,
): Promise<InterviewTurnResponse> {
  try {
    return await requestInterviewTurn({
      question,
      messages: [],
      interviewerFirstName,
    })
  } catch {
    return {
      reply: getSessionOpeningFallback(interviewerFirstName, question.title),
      role: 'interviewer',
    }
  }
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
    body: JSON.stringify({ text: prepareSpeechText(text) }),
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
      body: { text: prepareSpeechText(text) },
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

async function fetchDevInterviewTurn(body: InterviewTurnRequest): Promise<InterviewTurnResponse> {
  const response = await fetch('/api/interview-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let detail = `Interview API returned ${response.status}.`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) detail = payload.error
    } catch {
      // ignore
    }
    throw new InterviewTurnError(
      `${detail} Add OPENAI_API_KEY to .env or deploy the interview-turn Supabase function.`,
    )
  }

  const data = (await response.json()) as InterviewTurnResponse
  if (!data.reply) {
    throw new InterviewTurnError('Interview API returned an empty reply.')
  }

  return {
    reply: data.reply,
    role: data.role === 'hint' ? 'hint' : 'interviewer',
  }
}

export async function requestInterviewTurn(body: InterviewTurnRequest): Promise<InterviewTurnResponse> {
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke<InterviewTurnResponse>(
        'interview-turn',
        { body },
      )

      if (!error && data?.reply) {
        return {
          reply: data.reply,
          role: data.role === 'hint' ? 'hint' : 'interviewer',
        }
      }
    } catch {
      // fall through to dev proxy
    }
  }

  if (import.meta.env.DEV) {
    return fetchDevInterviewTurn(body)
  }

  throw new InterviewTurnError(
    'Interview is unavailable. Sign in and deploy the interview-turn Supabase function.',
  )
}

async function fetchDevTranscription(audio: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audio, 'utterance.webm')

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let detail = `Transcription API returned ${response.status}.`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) detail = payload.error
    } catch {
      // ignore
    }
    throw new TranscriptionError(
      detail.includes('OPENAI') || detail.includes('Whisper')
        ? detail
        : `${detail} Check the dev server log or your OpenAI API key.`,
    )
  }

  const data = (await response.json()) as TranscriptionResponse
  return data.text ?? ''
}

export async function requestTranscription(audio: Blob): Promise<string> {
  if (audio.size === 0) {
    throw new TranscriptionError('No audio to transcribe.')
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (token) {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        if (baseUrl && anonKey) {
          const formData = new FormData()
          formData.append('file', audio, 'utterance.webm')

          const response = await fetch(`${baseUrl}/functions/v1/transcribe`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: anonKey,
            },
            body: formData,
          })

          if (response.ok) {
            const data = (await response.json()) as TranscriptionResponse
            return data.text ?? ''
          }
        }
      }
    } catch {
      // fall through to dev proxy
    }
  }

  if (import.meta.env.DEV) {
    return fetchDevTranscription(audio)
  }

  throw new TranscriptionError(
    'Transcription is unavailable. Deploy the transcribe Supabase function.',
  )
}

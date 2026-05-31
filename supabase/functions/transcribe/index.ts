import { getUserIdFromRequest, jsonResponse, optionsResponse } from '../_shared/cors.ts'

const WHISPER_PROMPT =
  'Technical coding interview. Terms: hash map, binary search, dynamic programming, amortized, Big O, O(n log n), stack, queue, recursion.'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const { userId, error: authError } = await getUserIdFromRequest(req)
  if (!userId) {
    return jsonResponse({ error: authError ?? 'Unauthorized' }, 401)
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 503)
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return jsonResponse({ error: 'Missing audio file.' }, 400)
    }

    const whisperModel = Deno.env.get('OPENAI_WHISPER_MODEL') ?? 'whisper-1'
    const body = new FormData()
    body.append('file', file, file.name || 'audio.webm')
    body.append('model', whisperModel)
    body.append('language', 'en')
    body.append('prompt', WHISPER_PROMPT)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAiKey}` },
      body,
    })

    if (!response.ok) {
      const details = await response.text()
      console.error('Whisper error:', details)
      return jsonResponse({ error: 'Transcription failed.' }, 502)
    }

    const result = (await response.json()) as { text?: string }
    const text = result.text?.trim() ?? ''

    return jsonResponse({ text })
  } catch (error) {
    console.error('Transcribe error:', error)
    return jsonResponse({ error: 'Transcription request failed.' }, 500)
  }
})

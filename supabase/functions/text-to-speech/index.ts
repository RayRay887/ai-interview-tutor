import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { getUserIdFromRequest, jsonResponse, optionsResponse } from '../_shared/cors.ts'

interface TextToSpeechRequest {
  text: string
}

const MAX_CHARS = 800

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

  let payload: TextToSpeechRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const text = payload.text?.trim().slice(0, MAX_CHARS)
  if (!text) {
    return jsonResponse({ error: 'Missing text.' }, 400)
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 503)
  }

  const ttsModel = Deno.env.get('OPENAI_TTS_MODEL') ?? 'tts-1-hd'
  const ttsVoice = Deno.env.get('OPENAI_TTS_VOICE') ?? 'ash'

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ttsModel,
      voice: ttsVoice,
      input: text,
      speed: 0.95,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    console.error('OpenAI TTS error:', details)
    return jsonResponse({ error: 'Failed to synthesize speech.' }, 502)
  }

  const audioBuffer = await response.arrayBuffer()
  const audioBase64 = encodeBase64(new Uint8Array(audioBuffer))

  return jsonResponse({ audioBase64 })
})

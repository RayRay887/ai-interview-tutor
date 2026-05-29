import { corsHeaders, getUserIdFromRequest, jsonResponse, optionsResponse } from '../_shared/cors.ts'

interface InterviewMessage {
  role: 'interviewer' | 'candidate' | 'hint'
  text: string
}

interface InterviewQuestion {
  title: string
  description: string
  difficulty: string
  category: string
}

interface InterviewTurnRequest {
  question: InterviewQuestion
  messages: InterviewMessage[]
  userMessage?: string
}

const SYSTEM_PROMPT = `You are a calm, professional technical interviewer for coding practice sessions.

Rules:
- Keep replies concise (1-3 sentences) and conversational, as if speaking aloud.
- Ask one clear question at a time.
- Start by asking the candidate to explain their approach before coding.
- Give hints only when the candidate is stuck or asks for help. Mark hints with a practical nudge, not the full solution.
- Reference the problem context naturally.
- Do not write code unless the candidate explicitly asks for a small example.
- Encourage the candidate to state time and space complexity when relevant.`

function buildTranscript(messages: InterviewMessage[]): string {
  if (messages.length === 0) return 'No conversation yet.'

  return messages
    .map((message) => {
      const speaker =
        message.role === 'candidate'
          ? 'Candidate'
          : message.role === 'hint'
            ? 'Interviewer (hint)'
            : 'Interviewer'
      return `${speaker}: ${message.text}`
    })
    .join('\n')
}

function fallbackOpening(question: InterviewQuestion) {
  return {
    reply: `Hi — let's work on "${question.title}". Before you code, walk me through how you'd approach it and what complexity you're targeting.`,
    role: 'interviewer' as const,
  }
}

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

  let payload: InterviewTurnRequest
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const { question, messages, userMessage } = payload
  if (!question?.title || !question?.description) {
    return jsonResponse({ error: 'Missing question context.' }, 400)
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    if (!userMessage) {
      return jsonResponse(fallbackOpening(question))
    }
    return jsonResponse({
      reply:
        'Thanks for sharing. Go ahead and implement your approach, and let me know when you want feedback.',
      role: 'interviewer',
    })
  }

  const isOpening = !userMessage
  const userPrompt = isOpening
    ? `Problem: "${question.title}" (${question.difficulty}, ${question.category})
Description: ${question.description}

Open the interview with a spoken-style greeting and ask the candidate to explain their approach before coding.`
    : `Problem: "${question.title}" (${question.difficulty}, ${question.category})
Description: ${question.description}

Conversation so far:
${buildTranscript(messages)}

Respond to the candidate's latest message. If they seem stuck, you may reply with role "hint" instead of "interviewer". Return JSON only.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'interview_reply',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              reply: { type: 'string' },
              role: { type: 'string', enum: ['interviewer', 'hint'] },
            },
            required: ['reply', 'role'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    console.error('OpenAI error:', details)
    if (!userMessage) {
      return jsonResponse(fallbackOpening(question))
    }
    return jsonResponse({ error: 'Failed to generate interviewer reply.' }, 502)
  }

  const completion = await response.json()
  const content = completion.choices?.[0]?.message?.content

  try {
    const parsed = JSON.parse(content)
    if (!parsed.reply) {
      throw new Error('Missing reply')
    }
    return jsonResponse({
      reply: parsed.reply,
      role: parsed.role === 'hint' ? 'hint' : 'interviewer',
    })
  } catch {
    return jsonResponse(
      isOpening
        ? fallbackOpening(question)
        : {
            reply:
              'Thanks — keep going with your implementation and talk through your reasoning as you code.',
            role: 'interviewer',
          },
    )
  }
})

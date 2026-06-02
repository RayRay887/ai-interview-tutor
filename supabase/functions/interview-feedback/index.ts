import { jsonResponse, optionsResponse } from '../_shared/cors.ts'

interface FeedbackRequest {
  question: {
    title: string
    description: string
    difficulty: string
    category: string
    constraints?: string[]
  }
  code: { source: string; language: string }
  tests: {
    passed: number
    total: number
    allPassed: boolean
    hiddenPassed?: number
    hiddenTotal?: number
    lastFailures?: string[]
  }
  transcript: { role: string; text: string }[]
  session: { minutesTotal: number; minutesUsed: number; hintsUsed: number }
}

const CODE_MAX_CHARS = 3500
const TRANSCRIPT_MAX = 16

const criterionItem = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'score', 'summary'],
  properties: {
    id: { type: 'string' },
    score: { type: 'integer' },
    summary: { type: 'string' },
  },
}

const sectionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['criteria', 'strengths', 'improvements'],
  properties: {
    criteria: { type: 'array', items: criterionItem },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
  },
}

const feedbackJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['code', 'interview', 'optimization', 'recommendation', 'headline'],
  properties: {
    code: sectionSchema,
    interview: sectionSchema,
    optimization: {
      type: 'object',
      additionalProperties: false,
      required: [
        'criteria',
        'strengths',
        'improvements',
        'timeComplexity',
        'spaceComplexity',
        'isOptimal',
        'optimizationSummary',
      ],
      properties: {
        criteria: { type: 'array', items: criterionItem },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        timeComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        isOptimal: { type: 'boolean' },
        optimizationSummary: { type: 'string' },
      },
    },
    recommendation: {
      type: 'string',
      enum: ['strong_hire', 'hire', 'lean_hire', 'lean_no_hire', 'no_hire'],
    },
    headline: { type: 'string' },
  },
}

const SYSTEM_PROMPT = `You are a senior FAANG hiring committee member writing a post-interview debrief. Return three sections:

CODE (grade from code + tests only): code_quality, testing, edge_cases — each 1-4 with summary.
INTERVIEW (grade from transcript only): approach_explanation, logic_clarity, communication, collaboration — each 1-4.
OPTIMIZATION: time_complexity, space_complexity, optimization criteria plus timeComplexity, spaceComplexity strings, isOptimal boolean, optimizationSummary.

Scale: 1=No Hire, 2=Lean No Hire, 3=Hire, 4=Strong Hire. Calibrate strictly.
Each section: 2-4 strengths and 2-4 improvements.`

function truncateCode(source: string): string {
  if (source.length <= CODE_MAX_CHARS) return source
  const head = Math.floor(CODE_MAX_CHARS * 0.55)
  const tail = Math.floor(CODE_MAX_CHARS * 0.35)
  return `${source.slice(0, head)}\n… (truncated) …\n${source.slice(-tail)}`
}

function sliceTranscript(transcript: FeedbackRequest['transcript']) {
  return transcript.slice(-TRANSCRIPT_MAX).map((entry) => ({
    role: entry.role,
    text: entry.text.length > 500 ? `${entry.text.slice(0, 499)}…` : entry.text,
  }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse()
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 503)
  }

  try {
    const body = (await req.json()) as FeedbackRequest

    if (!body.question?.title || !body.code?.source) {
      return jsonResponse({ error: 'Missing question or code.' }, 400)
    }

    const transcriptText = sliceTranscript(body.transcript ?? [])
      .map((e) => `${e.role}: ${e.text}`)
      .join('\n')

    const userPrompt = `Problem: "${body.question.title}" (${body.question.difficulty}, ${body.question.category})
Description: ${body.question.description}
${body.question.constraints?.length ? `Constraints: ${body.question.constraints.join('; ')}` : ''}

Session: ${body.session.minutesUsed}/${body.session.minutesTotal} minutes, hints ${body.session.hintsUsed}
Tests: ${body.tests.passed}/${body.tests.total}${body.tests.allPassed ? ' all passing' : ''}${
      body.tests.hiddenTotal != null
        ? `, hidden ${body.tests.hiddenPassed ?? 0}/${body.tests.hiddenTotal}`
        : ''
    }${body.tests.lastFailures?.length ? `\nFailures: ${body.tests.lastFailures.join('; ')}` : ''}

Code (${body.code.language}):
${truncateCode(body.code.source)}

Transcript:
${transcriptText || '(none)'}

Return three-section debrief JSON.`

    const model =
      Deno.env.get('OPENAI_FEEDBACK_MODEL') ?? Deno.env.get('OPENAI_INTERVIEW_MODEL') ?? 'gpt-4o-mini'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'interview_feedback',
            strict: true,
            schema: feedbackJsonSchema,
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
      console.error('[interview-feedback]', details)
      return jsonResponse({ error: 'OpenAI feedback request failed.' }, 502)
    }

    const completion = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}') as Record<
      string,
      unknown
    >

    return jsonResponse(parsed, 200)
  } catch (error) {
    console.error('[interview-feedback]', error)
    return jsonResponse({ error: 'Feedback handler error.' }, 500)
  }
})

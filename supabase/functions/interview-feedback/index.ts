import { jsonResponse, optionsResponse } from '../_shared/cors.ts'
import {
  analyzeTranscript,
  formatTranscriptSignalsForPrompt,
} from '../_shared/feedbackTranscriptAnalysis.ts'

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

const STRICT_RULES = `STRICT EVIDENCE-BASED GRADING (non-negotiable):
- Grade ONLY from transcript quotes and submitted code/tests. Do not infer skills the candidate did not demonstrate in speech.
- If the interviewer asked about time or space complexity and the candidate did not state Big-O in the transcript → time_complexity=1, space_complexity=1, optimization_tradeoffs≤2, answer_relevance≤2.
- Off-topic or evasive answers to direct questions → answer_relevance≤2 and communication≤2. Quote the exchange in summaries.
- Passing all tests does NOT raise interview or optimization scores. Working code without verbal complexity analysis caps optimization at Lean No Hire.
- Summaries must cite transcript evidence. Never give 3 or 4 on verbal criteria without clear spoken evidence.
- hintsUsed >= 2 caps thrives_in_ambiguity and values_feedback at 2 unless transcript shows strong recovery.`

const SYSTEM_PROMPT = `You are a senior FAANG hiring committee member writing a post-interview debrief. Grade using Tech Interview Handbook + Golden Rubric. Return three JSON sections:

CODE — IDs: technical_competency, coding_syntax, testing (code + tests only).
INTERVIEW — IDs: communication, answer_relevance, problem_solving, thrives_in_ambiguity, values_feedback (transcript ONLY; hintsUsed calibrates values_feedback).
OPTIMIZATION — IDs: data_structures_algorithms, time_complexity, space_complexity, optimization_tradeoffs; plus timeComplexity, spaceComplexity, isOptimal, optimizationSummary.

Per criterion: id, score 1-4, summary citing evidence. Scale: 1=Strong No Hire … 4=Strong Hire.
Each section: 2-4 strengths, 2-4 improvements.

${STRICT_RULES}`

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

    const transcriptEntries = (body.transcript ?? []).map((e) => ({
      role: (e.role === 'candidate' || e.role === 'hint' ? e.role : 'interviewer') as
        | 'interviewer'
        | 'candidate'
        | 'hint',
      text: e.text,
    }))
    const transcriptSignals = formatTranscriptSignalsForPrompt(analyzeTranscript(transcriptEntries))
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

${transcriptSignals}

Transcript:
${transcriptText || '(none — default verbal scores to 1-2)'}

Return three-section debrief JSON. Apply mandatory caps from TRANSCRIPT SIGNALS.`

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
        temperature: 0,
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

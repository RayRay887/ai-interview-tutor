/** Heuristic transcript analysis to enforce evidence-based grading (client + dev proxy). */

export interface TranscriptEntry {
  role: 'interviewer' | 'candidate' | 'hint'
  text: string
}

export interface TranscriptSignals {
  candidateTurnCount: number
  complexityQuestionAsked: boolean
  complexityAnsweredInSpeech: boolean
  complexityDodgedOrOffTopic: boolean
  approachQuestionAsked: boolean
  approachAnsweredRelevantly: boolean
  silentOrMinimalVerbal: boolean
  /** Quoted examples for the grader prompt */
  complexityExchange: string
  relevanceIssues: string[]
}

const COMPLEXITY_ASK =
  /\b(time|space)\s+complexit|big-?o\b|\bruntime\b|\bhow (fast|slow|efficient)|what('s| is) the (time|space)|analyze (the )?complexit|O\s*\(/i

const COMPLEXITY_ANSWER =
  /\bo\s*\(\s*[^)]+\)|\b(linear|quadratic|logarithmic|log n|n log n|constant time|polynomial|exponential)\b|\bO\s+of\b/i

const APPROACH_ASK =
  /\b(approach|walk me through|how would you|what('s| is) your (plan|strategy)|think about|right track|explain your (logic|solution|thinking))/i

const APPROACH_ANSWER =
  /\b(hash|map|set|array|pointer|two pointer|sliding window|stack|queue|tree|graph|sort|search|iterate|loop|recursi|dynamic programming|greedy|binary search|bfs|dfs)\b/i

const OFF_TOPIC =
  /\b(i don't know|not sure|random|whatever|skip|don't care|no idea|can't say|haven't thought)\b/i

function isInterviewer(role: string) {
  return role === 'interviewer' || role === 'hint'
}

export function analyzeTranscript(transcript: TranscriptEntry[]): TranscriptSignals {
  const candidateTurns = transcript.filter((e) => e.role === 'candidate')
  const signals: TranscriptSignals = {
    candidateTurnCount: candidateTurns.length,
    complexityQuestionAsked: false,
    complexityAnsweredInSpeech: false,
    complexityDodgedOrOffTopic: false,
    approachQuestionAsked: false,
    approachAnsweredRelevantly: false,
    silentOrMinimalVerbal: candidateTurns.length === 0,
    complexityExchange: '',
    relevanceIssues: [],
  }

  let pendingComplexity = false
  let pendingApproach = false
  const exchangeLines: string[] = []

  for (const entry of transcript) {
    const text = entry.text.trim()
    if (!text) continue

    if (isInterviewer(entry.role)) {
      if (COMPLEXITY_ASK.test(text)) {
        signals.complexityQuestionAsked = true
        pendingComplexity = true
        pendingApproach = false
        exchangeLines.push(`Interviewer: ${text}`)
      } else if (APPROACH_ASK.test(text)) {
        signals.approachQuestionAsked = true
        pendingApproach = true
        pendingComplexity = false
      } else {
        pendingComplexity = false
        pendingApproach = false
      }
      continue
    }

    if (entry.role !== 'candidate') continue

    if (pendingComplexity) {
      exchangeLines.push(`Candidate: ${text}`)
      if (COMPLEXITY_ANSWER.test(text)) {
        signals.complexityAnsweredInSpeech = true
        pendingComplexity = false
      } else if (OFF_TOPIC.test(text) || text.split(/\s+/).length < 4) {
        signals.complexityDodgedOrOffTopic = true
        signals.relevanceIssues.push(
          `Interviewer asked about complexity; candidate did not give Big-O or complexity analysis: "${text.slice(0, 120)}"`,
        )
        pendingComplexity = false
      } else if (!COMPLEXITY_ANSWER.test(text)) {
        signals.complexityDodgedOrOffTopic = true
        signals.relevanceIssues.push(
          `Candidate response after complexity question appears off-topic or unrelated: "${text.slice(0, 120)}"`,
        )
        pendingComplexity = false
      }
    }

    if (pendingApproach) {
      if (APPROACH_ANSWER.test(text) || text.split(/\s+/).length >= 12) {
        signals.approachAnsweredRelevantly = true
        pendingApproach = false
      } else if (OFF_TOPIC.test(text)) {
        signals.relevanceIssues.push(
          `Candidate gave non-answer or off-topic response to approach question: "${text.slice(0, 120)}"`,
        )
        pendingApproach = false
      }
    }
  }

  if (signals.complexityQuestionAsked && !signals.complexityAnsweredInSpeech) {
    signals.complexityDodgedOrOffTopic = true
    if (!signals.relevanceIssues.some((r) => r.includes('complexity'))) {
      signals.relevanceIssues.push(
        'Interviewer asked about time/space complexity but candidate never stated Big-O or complexity analysis in the transcript.',
      )
    }
  }

  signals.complexityExchange = exchangeLines.slice(-4).join('\n')
  return signals
}

export function formatTranscriptSignalsForPrompt(signals: TranscriptSignals): string {
  const lines = [
    'TRANSCRIPT SIGNALS (enforce strictly — overrides generous LLM guesses):',
    `- complexityQuestionAsked: ${signals.complexityQuestionAsked}`,
    `- complexityAnsweredInSpeech: ${signals.complexityAnsweredInSpeech}`,
    `- complexityDodgedOrOffTopic: ${signals.complexityDodgedOrOffTopic}`,
    `- approachQuestionAsked: ${signals.approachQuestionAsked}`,
    `- approachAnsweredRelevantly: ${signals.approachAnsweredRelevantly}`,
    `- candidateTurnCount: ${signals.candidateTurnCount}`,
  ]
  if (signals.relevanceIssues.length) {
    lines.push('- relevanceIssues:')
    for (const issue of signals.relevanceIssues) {
      lines.push(`  • ${issue}`)
    }
  }
  if (signals.complexityExchange) {
    lines.push('- complexityExchange:')
    lines.push(signals.complexityExchange)
  }
  lines.push('')
  lines.push('MANDATORY CAPS when signals apply:')
  lines.push('- complexityQuestionAsked=true AND complexityAnsweredInSpeech=false → time_complexity=1, space_complexity=1, optimization_tradeoffs≤2, answer_relevance≤2')
  lines.push('- complexityDodgedOrOffTopic=true → answer_relevance≤2, communication≤2')
  lines.push('- silentOrMinimalVerbal=true → communication≤2, problem_solving≤2, answer_relevance=1')
  lines.push('- Never infer Big-O from code alone if candidate did not state it in transcript')
  return lines.join('\n')
}

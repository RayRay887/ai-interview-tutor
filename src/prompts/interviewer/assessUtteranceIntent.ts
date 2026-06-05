export type UtteranceIntent = 'expectsResponse' | 'thinkingAloud' | 'filler'

const EXPECTS_RESPONSE_PATTERN =
  /\?|\b(what do you think|am i on the right track|right track|does this|should i|can i|would this|is this|how do i|how should|could you|can you help|do you think|make sense|work for|handle|what about|any thoughts)\b/i

const HELP_PATTERN = /\b(hint|stuck|help me|need help|give me a nudge|not sure|confused|lost)\b/i

const THINKING_ALOUD_PATTERN =
  /\b(i'll|i will|let me|so i|going to|gonna|first i|next i|now i|then i|i'm going to|i am going to|iterate|loop through|loop over|add a|create a|check if|set up|initialize|return|variable|index|complement|hash|map|dictionary|store|lookup)\b/i

const FILLER_PATTERN =
  /^(?:um+|uh+|yeah|yep|ok(?:ay)?|hmm+|right|so|like|well|mhm+|ah+)[\s.!?,]*$/i

/** Heuristic intent — no LLM call. Used to gate turns during coding. */
export function assessUtteranceIntent(text: string): UtteranceIntent {
  const normalized = text.trim()
  if (!normalized) return 'filler'

  if (normalized.length < 10 && FILLER_PATTERN.test(normalized)) {
    return 'filler'
  }

  if (EXPECTS_RESPONSE_PATTERN.test(normalized) || HELP_PATTERN.test(normalized)) {
    return 'expectsResponse'
  }

  if (THINKING_ALOUD_PATTERN.test(normalized)) {
    return 'thinkingAloud'
  }

  if (normalized.length >= 18 && !normalized.endsWith('?')) {
    return 'thinkingAloud'
  }

  return 'expectsResponse'
}

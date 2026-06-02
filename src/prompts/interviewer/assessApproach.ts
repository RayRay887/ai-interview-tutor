export type ApproachClarity = 'vague' | 'partial' | 'concrete'

const STRUCTURE_PATTERN =
  /\b(hash\s*map|hashmap|dictionary|dict|map|set|array|two\s+pointers?|pointer|stack|queue|heap|binary\s+search|sort|nested\s+loop|for\s+loop|while\s+loop|iterate|iteration)\b/i

const ITERATION_PATTERN =
  /\b(loop|iterate|iteration|pass|scan|walk|each|every|while|for\s+each|one\s+pass|single\s+pass)\b/i

const STORE_COMPARE_PATTERN =
  /\b(store|stored|storing|lookup|look\s+up|check|compare|complement|key|value|index|indices|seen|visited|find|search|target|difference|sum)\b/i

/** Rule-based plan clarity — no LLM call. */
export function assessApproachClarity(text: string): ApproachClarity {
  const normalized = text.trim().toLowerCase()
  if (normalized.length < 8) return 'vague'

  const hasStructure = STRUCTURE_PATTERN.test(normalized)
  const hasIteration = ITERATION_PATTERN.test(normalized)
  const hasStoreCompare = STORE_COMPARE_PATTERN.test(normalized)

  if (hasStructure && hasIteration && hasStoreCompare) return 'concrete'
  if (hasStructure || hasIteration) return 'partial'
  return 'vague'
}

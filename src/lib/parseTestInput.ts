export function parseExampleInput(input: string): Record<string, unknown> {
  const args: Record<string, unknown> = {}

  for (const assignment of splitAssignments(input)) {
    const separator = assignment.indexOf('=')
    if (separator === -1) continue

    const key = assignment.slice(0, separator).trim()
    const rawValue = assignment.slice(separator + 1).trim()
    args[key] = parseValue(rawValue)
  }

  return args
}

export function parseExpectedOutput(output: string): unknown {
  return parseValue(output.trim())
}

function splitAssignments(input: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let quote: '"' | "'" | null = null

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (quote) {
      current += char
      if (char === quote && input[i - 1] !== '\\') {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }

    if (char === '[' || char === '{' || char === '(') {
      depth += 1
      current += char
      continue
    }

    if (char === ']' || char === '}' || char === ')') {
      depth -= 1
      current += char
      continue
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

function parseValue(rawValue: string): unknown {
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1)
  }

  if (rawValue === 'true') return true
  if (rawValue === 'false') return false
  if (rawValue === 'null') return null

  if (/^-?\d+$/.test(rawValue)) return Number(rawValue)
  if (/^-?\d+\.\d+$/.test(rawValue)) return Number(rawValue)

  try {
    return JSON.parse(rawValue.replace(/'/g, '"'))
  } catch {
    return new Function(`return (${rawValue})`)()
  }
}

export function valuesEqual(actual: unknown, expected: unknown): boolean {
  return stableStringify(normalizeValue(actual)) === stableStringify(normalizeValue(expected))
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map(normalizeValue)
    if (normalized.every((item) => Array.isArray(item))) {
      return [...normalized].sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)))
    }
    return normalized
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]),
    )
  }

  return value
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )
    return `{${entries.map(([key, nested]) => `${key}:${stableStringify(nested)}`).join(',')}}`
  }

  return JSON.stringify(value)
}

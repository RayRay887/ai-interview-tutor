import type { Question } from './questions'

export type CodeLanguage = 'python' | 'javascript' | 'typescript'

export const codeLanguages: { id: CodeLanguage; label: string; extension: string }[] = [
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
]

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

export function parsePythonSignature(starterCode: string) {
  const match = starterCode.match(/def\s+(\w+)\(([^)]*)\)/)
  if (!match) {
    return { fnName: 'solution', params: [] as string[] }
  }

  const params = match[2]
    .split(',')
    .map((part) => part.trim().split(':')[0].trim())
    .filter(Boolean)

  return { fnName: match[1], params }
}

export function getStarterCode(question: Question, language: CodeLanguage): string {
  if (language === 'python') {
    return question.starterCode
  }

  const { fnName, params } = parsePythonSignature(question.starterCode)
  const camelName = snakeToCamel(fnName)
  const paramList = params.join(', ')

  switch (language) {
    case 'javascript':
      return `function ${camelName}(${paramList}) {\n  // Your code here\n}`
    case 'typescript':
      return `function ${camelName}(${paramList}) {\n  // Your code here\n}`
  }
}

export function getLanguageExtension(language: CodeLanguage): string {
  return codeLanguages.find((lang) => lang.id === language)?.extension ?? 'txt'
}

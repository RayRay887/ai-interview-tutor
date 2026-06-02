import * as esbuild from 'esbuild-wasm'
import { loadPyodide, type PyodideInterface } from 'pyodide'
import {
  parsePythonSignature,
  snakeToCamel,
  type CodeLanguage,
} from '../data/languages'
import type { Question } from '../data/questions'
import { parseExampleInput, parseExpectedOutput, valuesEqual } from './parseTestInput'

export type ConsoleLevel = 'info' | 'success' | 'error' | 'warn'

export interface ConsoleEntry {
  id: string
  level: ConsoleLevel
  message: string
  line?: number
  column?: number
  source: 'compile' | 'runtime' | 'test'
}

export type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface TestResult {
  status: TestStatus
  actual?: string
  expected?: string
  error?: string
}

export interface RunTestsResult {
  consoleEntries: ConsoleEntry[]
  testResults: TestResult[]
}

export interface HiddenTestRunResult {
  passed: number
  total: number
  consoleEntries: ConsoleEntry[]
  testResults: TestResult[]
}

let esbuildReady = false
let pyodidePromise: Promise<PyodideInterface> | null = null
let entryCounter = 0

function nextId() {
  entryCounter += 1
  return String(entryCounter)
}

function createEntry(
  level: ConsoleLevel,
  message: string,
  source: ConsoleEntry['source'],
  line?: number,
  column?: number,
): ConsoleEntry {
  return { id: nextId(), level, message, line, column, source }
}

async function initEsbuild() {
  if (esbuildReady) return
  await esbuild.initialize({
    wasmURL: 'https://unpkg.com/esbuild-wasm@0.28.0/esbuild.wasm',
  })
  esbuildReady = true
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.4/full/',
    })
  }
  return pyodidePromise
}

function parseEsbuildError(error: unknown): ConsoleEntry {
  const text = error instanceof Error ? error.message : String(error)
  const match = text.match(/:(\d+):(\d+):\s*ERROR:\s*(.+)/)

  if (match) {
    return createEntry(
      'error',
      match[3].trim(),
      'compile',
      Number(match[1]),
      Number(match[2]),
    )
  }

  return createEntry('error', text, 'compile')
}

function parseJsRuntimeError(error: unknown): ConsoleEntry {
  const text = error instanceof Error ? error.message : String(error)
  const match = text.match(/:(\d+):(\d+)/)

  if (match) {
    return createEntry(
      'error',
      text.replace(/^SyntaxError:\s*/, ''),
      'runtime',
      Number(match[1]),
      Number(match[2]),
    )
  }

  return createEntry('error', text, 'runtime')
}

function parsePythonError(error: unknown): ConsoleEntry {
  const text = error instanceof Error ? error.message : String(error)
  const syntaxMatch = text.match(/File "<\w+>", line (\d+)[\s\S]*?\n\s*(.+)/)
  const lineMatch = text.match(/line (\d+)/)

  if (syntaxMatch) {
    return createEntry('error', syntaxMatch[2].trim(), 'compile', Number(syntaxMatch[1]))
  }

  if (lineMatch) {
    return createEntry(
      'error',
      text.split('\n').pop()?.trim() ?? text,
      'runtime',
      Number(lineMatch[1]),
    )
  }

  return createEntry('error', text, 'runtime')
}

async function compileJavaScript(code: string, language: 'javascript' | 'typescript') {
  await initEsbuild()
  try {
    const result = await esbuild.transform(code, {
      loader: language === 'typescript' ? 'ts' : 'js',
      target: 'es2020',
    })
    return { code: result.code }
  } catch (error) {
    if (typeof error === 'object' && error && 'errors' in error) {
      const failure = error as { errors: Array<{ text: string; location?: { line: number; column: number } }> }
      const first = failure.errors[0]
      if (first) {
        return {
          error: createEntry(
            'error',
            first.text.trim(),
            'compile',
            first.location?.line,
            first.location?.column,
          ),
        }
      }
    }
    return { error: parseEsbuildError(error) }
  }
}

async function validatePython(code: string): Promise<ConsoleEntry | null> {
  const pyodide = await getPyodide()
  try {
    await pyodide.runPythonAsync(`
import ast
ast.parse(${JSON.stringify(code)})
`)
    return null
  } catch (error) {
    return parsePythonError(error)
  }
}

async function runPythonCase(
  pyodide: PyodideInterface,
  code: string,
  fnName: string,
  args: unknown[],
): Promise<{ result?: unknown; error?: ConsoleEntry }> {
  const argsJson = JSON.stringify(args)

  try {
    const resultJson = await pyodide.runPythonAsync(`
import json
${code}
_result = ${fnName}(*json.loads(${JSON.stringify(argsJson)}))
json.dumps(_result)
`)
    return { result: JSON.parse(String(resultJson)) }
  } catch (error) {
    return { error: parsePythonError(error) }
  }
}

async function runJavaScriptCase(
  compiledCode: string,
  fnName: string,
  args: unknown[],
): Promise<{ result?: unknown; error?: ConsoleEntry }> {
  try {
    const runner = new Function(
      `${compiledCode}\nreturn typeof ${fnName} === "function" ? ${fnName} : undefined;`,
    )
    const fn = runner()

    if (typeof fn !== 'function') {
      return {
        error: createEntry(
          'error',
          `Function "${fnName}" was not found. Make sure your solution is defined.`,
          'runtime',
        ),
      }
    }

    return { result: fn(...args) }
  } catch (error) {
    return { error: parseJsRuntimeError(error) }
  }
}

export interface TestCase {
  input: string
  output: string
}

export async function runQuestionTests(
  question: Question,
  code: string,
  language: CodeLanguage,
  testCases: TestCase[],
): Promise<RunTestsResult> {
  const consoleEntries: ConsoleEntry[] = [
    createEntry('info', `Running ${testCases.length} test case(s) in ${language}...`, 'test'),
  ]
  const testResults: TestResult[] = testCases.map(() => ({ status: 'running' }))
  const { fnName, params } = parsePythonSignature(question.starterCode)
  const runtimeFnName = language === 'python' ? fnName : snakeToCamel(fnName)

  let compiledJavaScript: string | undefined
  let pyodide: PyodideInterface | undefined

  if (language === 'python') {
    const compileError = await validatePython(code)
    if (compileError) {
      consoleEntries.push(compileError)
      return {
        consoleEntries,
        testResults: testCases.map(() => ({
          status: 'failed',
          error: compileError.message,
        })),
      }
    }
    pyodide = await getPyodide()
  } else {
    const compiled = await compileJavaScript(code, language)
    if (compiled.error) {
      consoleEntries.push(compiled.error)
      return {
        consoleEntries,
        testResults: testCases.map(() => ({
          status: 'failed',
          error: compiled.error.message,
        })),
      }
    }
    compiledJavaScript = compiled.code
  }

  for (let index = 0; index < testCases.length; index += 1) {
    const example = testCases[index]

    if (!example.input.trim() || !example.output.trim()) {
      const message = `Test case ${index + 1} is missing input or expected output.`
      consoleEntries.push(createEntry('error', message, 'test'))
      testResults[index] = { status: 'failed', error: message }
      continue
    }

    const parsedInput = parseExampleInput(example.input)
    const expected = parseExpectedOutput(example.output)
    const args = params.map((param) => parsedInput[param])

    if (args.some((value) => value === undefined)) {
      const message = `Could not parse input for test case ${index + 1}.`
      consoleEntries.push(createEntry('error', message, 'test'))
      testResults[index] = { status: 'failed', error: message }
      continue
    }

    const execution =
      language === 'python'
        ? await runPythonCase(pyodide!, code, runtimeFnName, args)
        : await runJavaScriptCase(compiledJavaScript!, runtimeFnName, args)

    if (execution.error) {
      consoleEntries.push(execution.error)
      testResults[index] = {
        status: 'failed',
        error: execution.error.message,
      }
      continue
    }

    const actual = execution.result
    const actualLabel = stablePreview(actual)

    if (valuesEqual(actual, expected)) {
      consoleEntries.push(
        createEntry(
          'success',
          `Case ${index + 1} passed. Output: ${actualLabel}`,
          'test',
        ),
      )
      testResults[index] = { status: 'passed', actual: actualLabel }
    } else {
      const message = `Case ${index + 1} failed. Expected ${stablePreview(expected)}, got ${actualLabel}.`
      consoleEntries.push(createEntry('error', message, 'test'))
      testResults[index] = {
        status: 'failed',
        expected: stablePreview(expected),
        actual: actualLabel,
        error: message,
      }
    }
  }

  const passedCount = testResults.filter((result) => result.status === 'passed').length
  consoleEntries.push(
    createEntry(
      passedCount === testResults.length ? 'success' : 'warn',
      `${passedCount}/${testResults.length} test cases passed.`,
      'test',
    ),
  )

  return { consoleEntries, testResults }
}

/** Run hidden cases; per-case expected/actual are returned for the UI only (not logged to console). */
export async function runHiddenQuestionTests(
  question: Question,
  code: string,
  language: CodeLanguage,
  testCases: TestCase[],
): Promise<HiddenTestRunResult> {
  const consoleEntries: ConsoleEntry[] = [
    createEntry('info', `Running ${testCases.length} hidden test case(s)...`, 'test'),
  ]
  const failAll = (message: string): HiddenTestRunResult => ({
    passed: 0,
    total: testCases.length,
    consoleEntries,
    testResults: testCases.map(() => ({ status: 'failed', error: message })),
  })

  if (testCases.length === 0) {
    return { passed: 0, total: 0, consoleEntries, testResults: [] }
  }

  const { fnName, params } = parsePythonSignature(question.starterCode)
  const runtimeFnName = language === 'python' ? fnName : snakeToCamel(fnName)

  let compiledJavaScript: string | undefined
  let pyodide: PyodideInterface | undefined

  if (language === 'python') {
    const compileError = await validatePython(code)
    if (compileError) {
      consoleEntries.push(compileError)
      return failAll(compileError.message)
    }
    pyodide = await getPyodide()
  } else {
    const compiled = await compileJavaScript(code, language)
    if (compiled.error) {
      consoleEntries.push(compiled.error)
      return failAll(compiled.error.message)
    }
    compiledJavaScript = compiled.code
  }

  const testResults: TestResult[] = testCases.map(() => ({ status: 'running' }))
  let passed = 0

  for (let index = 0; index < testCases.length; index += 1) {
    const example = testCases[index]
    const parsedInput = parseExampleInput(example.input)
    const expected = parseExpectedOutput(example.output)
    const expectedLabel = stablePreview(expected)
    const args = params.map((param) => parsedInput[param])

    if (args.some((value) => value === undefined)) {
      const message = `Hidden test case ${index + 1} could not be parsed.`
      testResults[index] = { status: 'failed', error: message }
      continue
    }

    const execution =
      language === 'python'
        ? await runPythonCase(pyodide!, code, runtimeFnName, args)
        : await runJavaScriptCase(compiledJavaScript!, runtimeFnName, args)

    if (execution.error) {
      testResults[index] = {
        status: 'failed',
        error: execution.error.message,
      }
      continue
    }

    const actualLabel = stablePreview(execution.result)

    if (valuesEqual(execution.result, expected)) {
      testResults[index] = { status: 'passed' }
      passed += 1
    } else {
      testResults[index] = {
        status: 'failed',
        expected: expectedLabel,
        actual: actualLabel,
      }
    }
  }

  const summaryLevel = passed === testCases.length ? 'success' : 'warn'
  consoleEntries.push(
    createEntry(
      summaryLevel,
      `Hidden: ${passed}/${testCases.length} passed${passed === testCases.length ? '' : ` (${testCases.length - passed} failed)`}`,
      'test',
    ),
  )

  return { passed, total: testCases.length, consoleEntries, testResults }
}

function stablePreview(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  return JSON.stringify(value)
}

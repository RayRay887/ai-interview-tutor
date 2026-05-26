import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Code2,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  codeLanguages,
  getLanguageExtension,
  getStarterCode,
  type CodeLanguage,
} from '../../data/languages'
import type { Question } from '../../data/questions'
import {
  runQuestionTests,
  type ConsoleEntry,
  type TestCase,
  type TestResult,
} from '../../lib/codeRunner'
import { CodeEditor } from './CodeEditor'
import { CollapsibleSection } from './CollapsibleSection'
import { ConsolePanel } from './ConsolePanel'

interface PracticeSessionProps {
  question: Question
}

interface CustomTestCase {
  id: string
  input: string
  output: string
}

function createIdleResults(count: number): TestResult[] {
  return Array.from({ length: count }, () => ({ status: 'idle' }))
}

export function PracticeSession({ question }: PracticeSessionProps) {
  const [language, setLanguage] = useState<CodeLanguage>('python')
  const [codeByLanguage, setCodeByLanguage] = useState<Partial<Record<CodeLanguage, string>>>({
    python: question.starterCode,
  })
  const [customTestCases, setCustomTestCases] = useState<CustomTestCase[]>([])
  const [timerRunning, setTimerRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>(() =>
    createIdleResults(question.examples.length),
  )

  const code = codeByLanguage[language] ?? getStarterCode(question, language)
  const fileName = `${question.slug}.${getLanguageExtension(language)}`
  const inputPlaceholder = question.examples[0]?.input ?? 'nums = [1, 2], target = 3'
  const outputPlaceholder = question.examples[0]?.output ?? '[0, 1]'

  const allTestCases = useMemo<TestCase[]>(
    () => [
      ...question.examples,
      ...customTestCases.map(({ input, output }) => ({ input, output })),
    ],
    [question.examples, customTestCases],
  )

  const totalCount = allTestCases.length

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const resetTestResults = () => {
    setTestResults(createIdleResults(question.examples.length + customTestCases.length))
  }

  const handleLanguageChange = (nextLanguage: CodeLanguage) => {
    setCodeByLanguage((current) => ({
      ...current,
      [language]: code,
    }))
    setLanguage(nextLanguage)
    setConsoleEntries([])
    resetTestResults()
  }

  const handleCodeChange = (value: string) => {
    setCodeByLanguage((current) => ({
      ...current,
      [language]: value,
    }))
  }

  const handleAddCustomTestCase = () => {
    setCustomTestCases((current) => [
      ...current,
      { id: crypto.randomUUID(), input: '', output: '' },
    ])
    setTestResults((current) => [...current, { status: 'idle' }])
  }

  const handleRemoveCustomTestCase = (id: string) => {
    const customIndex = customTestCases.findIndex((testCase) => testCase.id === id)
    if (customIndex === -1) return

    setCustomTestCases((current) => current.filter((testCase) => testCase.id !== id))
    setTestResults((current) =>
      current.filter((_, index) => index !== question.examples.length + customIndex),
    )
  }

  const handleCustomTestCaseChange = (
    id: string,
    field: 'input' | 'output',
    value: string,
  ) => {
    setCustomTestCases((current) =>
      current.map((testCase) =>
        testCase.id === id ? { ...testCase, [field]: value } : testCase,
      ),
    )
  }

  const handleRunTests = async () => {
    setIsRunningTests(true)
    setConsoleEntries([])
    setTestResults(allTestCases.map(() => ({ status: 'running' })))

    try {
      const result = await runQuestionTests(question, code, language, allTestCases)
      setConsoleEntries(result.consoleEntries)
      setTestResults(result.testResults)
    } catch (error) {
      setConsoleEntries([
        {
          id: 'runtime-error',
          level: 'error',
          message: error instanceof Error ? error.message : 'Unexpected error while running tests.',
          source: 'runtime',
        },
      ])
      setTestResults(allTestCases.map(() => ({ status: 'failed' })))
    } finally {
      setIsRunningTests(false)
    }
  }

  const passedCount = testResults.filter((result) => result.status === 'passed').length
  const hasRunTests = testResults.some((result) => result.status !== 'idle')
  const allPassed = hasRunTests && passedCount === totalCount

  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  const renderTestStatus = (status: TestResult['status']) => {
    if (status === 'passed') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
    }
    if (status === 'running') {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-blue" />
    }
    if (status === 'failed') {
      return <XCircle className="h-3.5 w-3.5 text-rose-400" />
    }
    return <AlertCircle className="h-3.5 w-3.5 text-text-secondary/50" />
  }

  return (
    <div className="glass glow-blue flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text-primary">{question.title}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              question.difficulty === 'Easy'
                ? 'bg-emerald-500/15 text-emerald-400'
                : question.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {question.difficulty}
          </span>
          <span className="hidden text-xs text-text-secondary sm:inline">{question.category}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-sm">
            {timerRunning && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            )}
            <span className="text-rose-400">{formatTime(elapsed)}</span>
          </div>
          <button
            type="button"
            onClick={() => setTimerRunning(!timerRunning)}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-text-secondary hover:bg-white/10"
          >
            {timerRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,32%)_1fr]">
        <div className="flex min-h-0 flex-col border-b border-white/10 lg:border-r lg:border-b-0">
          <div className="border-b border-white/10 bg-bg-secondary/40 px-5 py-3">
            <h2 className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
              Problem
            </h2>
          </div>

          <div className="theme-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Description</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{question.description}</p>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Examples</h3>
              <div className="space-y-4">
                {question.examples.map((example, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-bg-primary/60 p-4"
                  >
                    <p className="mb-2 text-xs font-medium text-accent-blue">
                      Example {index + 1}
                    </p>
                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-text-secondary">Input: </span>
                        <span className="text-text-primary">{example.input}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Output: </span>
                        <span className="text-emerald-400">{example.output}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {question.constraints && question.constraints.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">Constraints</h3>
                <ul className="space-y-2 rounded-xl border border-white/10 bg-bg-primary/60 p-4">
                  {question.constraints.map((constraint, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm leading-relaxed text-text-secondary"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-blue" />
                      {constraint}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-bg-secondary/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-accent-blue" />
              <span className="font-mono text-xs text-text-primary">{fileName}</span>
            </div>

            <div className="relative">
              <label htmlFor="language-select" className="sr-only">
                Programming language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(event) => handleLanguageChange(event.target.value as CodeLanguage)}
                className="appearance-none rounded-lg border border-white/10 bg-bg-primary/80 py-2 pr-9 pl-3 text-xs text-text-primary outline-none transition-colors hover:border-accent-blue/40 focus:border-accent-blue/60"
              >
                {codeLanguages.map((option) => (
                  <option key={option.id} value={option.id} className="bg-bg-secondary">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <CodeEditor value={code} language={language} onChange={handleCodeChange} />
          </div>

          <ConsolePanel entries={consoleEntries} />

          <CollapsibleSection
            title="Test Cases"
            badge={
              hasRunTests && !isRunningTests ? (
                <span
                  className={`text-[10px] font-medium normal-case ${
                    allPassed
                      ? 'text-emerald-400'
                      : passedCount === 0
                        ? 'text-rose-400'
                        : 'text-amber-400'
                  }`}
                >
                  {passedCount}/{totalCount} passed
                </span>
              ) : isRunningTests ? (
                <span className="text-[10px] font-medium text-accent-blue normal-case">Running...</span>
              ) : null
            }
            action={
              <button
                type="button"
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="shrink-0 rounded-lg bg-accent-blue/20 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunningTests ? 'Running...' : 'Run tests'}
              </button>
            }
            contentClassName="theme-scrollbar max-h-64 overflow-y-auto p-4 pt-0"
          >
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {question.examples.map((example, index) => {
                  const result = testResults[index]
                  const status = result?.status ?? 'idle'

                  return (
                    <div
                      key={`builtin-${index}`}
                      className="rounded-lg border border-white/10 bg-bg-primary/60 p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        {renderTestStatus(status)}
                        <span className="text-xs font-medium text-text-primary">
                          Case {index + 1}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-text-secondary">{example.input}</p>
                      <p className="font-mono text-[10px] text-emerald-400/90">→ {example.output}</p>
                      {result?.actual && status === 'failed' && (
                        <p className="mt-1 font-mono text-[10px] text-rose-400/90">
                          Got: {result.actual}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {customTestCases.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium tracking-wider text-text-secondary uppercase">
                    Custom
                  </p>
                  <div className="space-y-2">
                    {customTestCases.map((testCase, index) => {
                      const resultIndex = question.examples.length + index
                      const result = testResults[resultIndex]
                      const status = result?.status ?? 'idle'

                      return (
                        <div
                          key={testCase.id}
                          className="rounded-lg border border-accent-blue/20 bg-bg-primary/60 p-2.5"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {renderTestStatus(status)}
                              <span className="text-xs font-medium text-text-primary">
                                Custom {index + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTestCase(testCase.id)}
                              className="rounded p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-rose-400"
                              aria-label={`Remove custom test case ${index + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <label className="mb-1 block text-[10px] text-text-secondary">Input</label>
                          <input
                            type="text"
                            value={testCase.input}
                            onChange={(event) =>
                              handleCustomTestCaseChange(testCase.id, 'input', event.target.value)
                            }
                            placeholder={inputPlaceholder}
                            className="mb-2 w-full rounded border border-white/10 bg-bg-secondary/60 px-2 py-1.5 font-mono text-[10px] text-text-primary outline-none focus:border-accent-blue/40"
                          />

                          <label className="mb-1 block text-[10px] text-text-secondary">
                            Expected output
                          </label>
                          <input
                            type="text"
                            value={testCase.output}
                            onChange={(event) =>
                              handleCustomTestCaseChange(testCase.id, 'output', event.target.value)
                            }
                            placeholder={outputPlaceholder}
                            className="w-full rounded border border-white/10 bg-bg-secondary/60 px-2 py-1.5 font-mono text-[10px] text-text-primary outline-none focus:border-accent-blue/40"
                          />

                          {result?.actual && status === 'failed' && (
                            <p className="mt-2 font-mono text-[10px] text-rose-400/90">
                              Got: {result.actual}
                            </p>
                          )}
                          {result?.error && status === 'failed' && !result.actual && (
                            <p className="mt-2 font-mono text-[10px] text-rose-400/90">
                              {result.error}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddCustomTestCase}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-2 text-xs text-text-secondary transition-colors hover:border-accent-blue/30 hover:text-accent-blue"
              >
                <Plus className="h-3.5 w-3.5" />
                Add test case
              </button>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

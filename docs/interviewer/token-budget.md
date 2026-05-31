# Token Budget — Interviewer Context

Keep each turn under roughly **2,000–2,500 input tokens** (system prompt + context + user turn). Use [`buildContext.ts`](../../src/prompts/interviewer/buildContext.ts) to enforce these limits before calling the LLM.

## Targets

| Block | Budget | Rule |
|-------|--------|------|
| System prompt | ~800 tokens | Static; do not bloat with examples |
| Question | ~200–400 tokens | Full description on **opening** only; later turns: title + difficulty + constraints |
| Transcript | ~400–600 tokens | Last **12** turns; always keep turn 1 (opening) |
| Code editor | ~400–700 tokens | Max **2,500 chars**; if unchanged, send metadata only |
| Console | ~100–200 tokens | Last **6** entries, **120 chars** each |
| Tests | ~50–150 tokens | Pass/total + up to **3** failure lines (80 chars each) |
| Session + signals | ~50 tokens | Phase, minutes left, flags |

## Code editor (live snapshot)

- Send `code.source` from the active language buffer every turn the candidate may be coding.
- Set `changedSinceLastTurn: false` when the buffer hash matches the last LLM call — the model receives `(unchanged, N lines)` instead of full source.
- Truncate long files: keep **first 40% + last 40%** with `… (M lines omitted) …` in the middle.
- Never send starter template twice unchanged across many turns.

## Console (compile / runtime panel)

- Map `ConsoleEntry[]` from `codeRunner.ts` to `{ level, message, line? }`.
- Include only **error** and **warn** on most turns; add **info** when `testsJustRun` is true.
- Drop duplicate consecutive messages.

## Transcript

- Cap candidate messages at **500 chars** each (STT can ramble).
- Drop filler-only turns ("um", "yeah") before sending.
- Off-topic or jailbreak attempts stay in transcript so the model can redirect — do not strip them.

## When to skip blocks

| Situation | Omit |
|-----------|------|
| `phase === 'opening'` or `'approach'` | Full code (send line count only if non-starter) |
| Code unchanged for 3+ turns | Full source (metadata only) |
| No test run yet | `tests.lastFailures` |
| Console empty | Entire `console` block |

## Model choice

- Prefer **gpt-4o-mini** (or equivalent small model) for turn replies.
- Reserve larger models for offline rubric generation, not live voice loops.

## Monitoring

Log **approximate** input size per turn in dev (`buildContextStats`). Alert if context JSON exceeds **8 KB** before truncation.

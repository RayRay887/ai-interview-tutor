# Interviewer Context Schema

Payload to send the LLM on **every turn** (plus the system prompt). Aligns with [`PracticeSession`](../../src/components/practice/PracticeSession.tsx), [`runQuestionTests`](../../src/lib/codeRunner.ts), and [`Question`](../../src/data/questions.ts).

TypeScript definitions: [`src/prompts/interviewer/types.ts`](../../src/prompts/interviewer/types.ts)

## JSON shape

```json
{
  "question": {
    "title": "Pair Target Indices",
    "description": "You receive a list of integers and a target total...",
    "difficulty": "Easy",
    "category": "Arrays & Hashmaps",
    "constraints": ["2 ≤ nums.length ≤ 10⁴", "Each input has exactly one solution."],
    "examples": [
      { "input": "values = [2, 7, 11, 15], target = 9", "output": "[0, 1]" }
    ]
  },
  "session": {
    "language": "python",
    "minutesTotal": 20,
    "minutesRemaining": 14,
    "phase": "implementation"
  },
  "code": {
    "source": "def pair_target_indices(values, target):\n    ...",
    "changedSinceLastTurn": true,
    "lineCount": 12
  },
  "console": [
    { "level": "error", "message": "SyntaxError: invalid syntax", "line": 4 }
  ],
  "tests": {
    "passed": 1,
    "total": 2,
    "lastFailures": ["Case 2: expected [1, 2], got [0, 1]"]
  },
  "transcript": [
    { "role": "interviewer", "text": "Walk me through your approach.", "timestamp": 0 },
    { "role": "candidate", "text": "I'd use a hash map.", "timestamp": 45000 }
  ],
  "signals": {
    "silenceSeconds": 12,
    "testsJustRun": false,
    "candidateAskedForHint": false,
    "alreadyCoding": true,
    "silenceProbe": false
  },
  "hintState": {
    "levelUsed": 1
  }
}
```

## Field reference

### `question`

| Field | Source |
|-------|--------|
| `title`, `description`, `difficulty`, `category` | `Question` |
| `constraints` | `Question.constraints` (optional) |
| `examples` | `Question.examples` |

### `session`

| Field | Source |
|-------|--------|
| `language` | `PracticeSession` language selector (`python` \| `javascript` \| `typescript`) |
| `minutesTotal` | `sessionMinutes` from setup modal |
| `minutesRemaining` | Countdown timer (`remainingSeconds / 60`, ceil) |
| `phase` | Derived from elapsed time + transitions in [interview-phases.md](./interview-phases.md) |

### `code`

| Field | Source |
|-------|--------|
| `source` | Current editor buffer for active language (may be omitted when unchanged—see token-budget.md) |
| `changedSinceLastTurn` | `true` if source !== snapshot at last LLM call |
| `lineCount` | Total lines in buffer (always send when omitting full `source`) |
| `truncated` | `true` if middle of file was elided for token budget |

Build with [`buildInterviewerPayload`](../../src/prompts/interviewer/buildContext.ts) before each LLM call.

### `console`

| Field | Source |
|-------|--------|
| `level` | `ConsoleEntry.level` from [`codeRunner.ts`](../../src/lib/codeRunner.ts) (`info` \| `success` \| `error` \| `warn`) |
| `message` | `ConsoleEntry.message` (truncated) |
| `line` | Optional source line from compile/runtime errors |

| When to send |
|--------------|
| After **Run tests** or when errors appear in the console panel |
| Prefer **error** / **warn**; include **info** when `testsJustRun` is true |
| Last **6** entries max ([token-budget.md](./token-budget.md)) |

The interviewer uses console output to ask about syntax errors, failed runs, and stack traces—without reading the panel aloud verbatim.

### `tests`

| Field | Source |
|-------|--------|
| `passed` | Count of `testResults` with `status === 'passed'` |
| `total` | Length of `testResults` |
| `lastFailures` | Human-readable strings from last run (optional) |

### `transcript`

| Field | Source |
|-------|--------|
| `role` | `interviewer` \| `candidate` (hints may use `hint` in UI only) |
| `text` | STT transcript or interviewer TTS text |
| `timestamp` | Ms since session start |

Send the **last 12 turns** (default); always include the opening. Cap candidate text at **500 chars** per turn. See [token-budget.md](./token-budget.md).

### `signals`

| Field | When to set |
|-------|-------------|
| `silenceSeconds` | Since last candidate speech ended |
| `testsJustRun` | `true` for one turn after Run tests completes |
| `candidateAskedForHint` | Phrases like "hint", "stuck", "help" detected |
| `approachClarity` | Client-side rule: `vague` \| `partial` \| `concrete` |
| `approachProbeCount` | How many approach follow-up questions the interviewer has asked |
| `sessionJustResumedAfterPauseSeconds` | Set once after the candidate resumes from pause |
| `alreadyCoding` | `true` when editor code differs from starter or has grown beyond the template |
| `silenceProbe` | `true` on proactive turns when the candidate has been coding silently (~50s) |

Utterance gating (thinking-aloud during coding) runs **client-side** in [`useInterviewSession.ts`](../../src/hooks/useInterviewSession.ts)—those monologues are not sent to the LLM. See [`assessUtteranceIntent.ts`](../../src/prompts/interviewer/assessUtteranceIntent.ts).

### `hintState`

| Field | Source |
|-------|--------|
| `levelUsed` | Highest hint ladder level delivered (0–4) |

## Phase calculation (reference)

```text
elapsed = minutesTotal - minutesRemaining
openingEnd    = minutesTotal * 0.05
approachEnd   = minutesTotal * 0.25
implementEnd  = minutesTotal * 0.70
testingEnd    = minutesTotal * 0.85
optimEnd      = minutesTotal * 0.95
// else wrap_up
```

Override with explicit transitions (e.g. all tests passed → testing).

## Edge function mapping (existing)

Today's [`interview-turn`](../../supabase/functions/interview-turn/index.ts) accepts:

```typescript
{ question, messages, userMessage? }
```

To adopt this schema, extend the request body with `code`, `console`, `tests`, `session`, `signals`, and `hintState`, and build the user message with `buildInterviewerUserMessage()` from [`buildContext.ts`](../../src/prompts/interviewer/buildContext.ts).

## Privacy

- Do not log full `code.source` to analytics without consent.
- Transcripts may contain PII from speech—treat as user data.

# Prepify FAANG Interview Agent Playbook

Voice-first system prompt and phase script for the AI technical interviewer. Use this playbook when configuring the LLM behind practice sessions—not as end-user documentation.

## What's in this folder

| File | Purpose |
|------|---------|
| [system-prompt.md](./system-prompt.md) | Paste into the model as the **system** message (or merge with edge function prompt) |
| [interview-phases.md](./interview-phases.md) | Time-boxed phases, transition rules, example spoken lines |
| [hint-ladder.md](./hint-ladder.md) | Escalating hints without giving away the answer |
| [context-schema.md](./context-schema.md) | JSON/context fields to send each turn |
| [token-budget.md](./token-budget.md) | Per-turn token limits, code/console truncation |
| [examples/pair-target-indices.md](./examples/pair-target-indices.md) | Full sample dialogue for the Pair Target Indices problem |

TypeScript: [`types.ts`](../../src/prompts/interviewer/types.ts), [`buildContext.ts`](../../src/prompts/interviewer/buildContext.ts)

## Voice constraints

The interviewer speaks aloud (TTS). Every reply should:

- Use **plain spoken English**—no markdown, bullets, or code fences in output.
- Stay **short**: about 1–2 sentences per turn (up to 3 when summarizing).
- Ask **one question at a time**.
- Allow **8–15 seconds** of silence before offering a hint.
- Sound like a **calm FAANG phone screen**: neutral, professional, not chatty or robotic.

## How to use with an LLM

1. Load **system-prompt.md** as the system instruction.
2. On each turn, build a compact payload with **`buildInterviewerPayload()`** ([token-budget.md](./token-budget.md))—question, live **code editor**, **console** errors, tests, transcript, phase, time remaining, hint level.
3. Optionally append the current phase goals from **interview-phases.md** as a short reminder.
4. Parse the model's plain-text reply and send it to TTS.

### Minimal turn template

```text
[Context JSON or structured block from context-schema.md]

Current phase: approach
Minutes remaining: 14
Candidate just said: "I'd use nested loops first."

Respond as the interviewer (spoken English only).
```

## Wiring in Prepify (today)

Practice sessions already include:

- Question metadata from `src/data/questions.ts`
- Code editor + test runner (`PracticeSession`, `codeRunner.ts`)
- Microphone setup (`MicrophoneSetupModal.tsx`)
- `InterviewerPanel`, `useInterviewSession`, `interview-turn` edge function (basic prompt on `main`)

**This playbook is the source of truth** for a richer FAANG-style prompt. To adopt it:

1. Replace or extend `SYSTEM_PROMPT` in `supabase/functions/interview-turn/index.ts` with content from `system-prompt.md`.
2. Expand the request body to match `InterviewerContext` in `context-schema.md` (code snapshot, test results, phase, hint level).
3. Keep `text-to-speech` for spoken replies.

## What this playbook does not cover

- Speech-to-text (STT) vendor choice or VAD tuning
- Transcript persistence in Supabase (future table design)
- Hiring decisions or score rubrics stored in a database

## Success check

A dry run with `system-prompt.md` + context from the Pair Target Indices example should produce:

- An opening that asks for approach before coding
- Probes that reference the candidate's words, not generic fluff
- Hints that escalate without naming "hash map" at level 1
- A wrap-up with complexity and one improvement area

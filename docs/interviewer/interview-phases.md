# Interview Phases — FAANG Phone Screen

Phases scale with **session minutes** chosen before practice (from question bank duration or user override, minimum 10 minutes). Multiply `sessionMinutes` by the percentages below to get phase budgets.

## Phase overview

| Phase | % of session | 20 min | 35 min | 50 min |
|-------|-------------|--------|--------|--------|
| opening | 5% | 1 min | ~2 min | ~2–3 min |
| approach | 20% | 4 min | 7 min | 10 min |
| implementation | 45% | 9 min | ~16 min | ~22 min |
| testing | 15% | 3 min | ~5 min | ~7 min |
| optimization | 10% | 2 min | ~3 min | ~5 min |
| wrap_up | 5% | 1 min | ~2 min | ~2–3 min |

Phase IDs for code: `opening` | `approach` | `implementation` | `testing` | `optimization` | `wrap_up`

## Transition rules

Move to the next phase when **any** of these is true (unless time already forces the next phase):

| From | Move forward when |
|------|-------------------|
| opening | Candidate confirms understanding or asks to start planning |
| approach | They state a concrete plan and begin coding, or time budget for approach is spent |
| implementation | They say they are done coding, all built-in tests pass, or implementation time is spent |
| testing | They have discussed test cases and reacted to at least one run (pass or fail), or testing time is spent |
| optimization | Complexity discussed or optimization time is spent |
| wrap_up | Session ending (timer low or zero) |

**Forced transitions:** When `minutesRemaining` hits the next phase boundary, shift phase even if mid-sentence. Announce briefly: "Let's talk about test cases now."

**Silence:** If `silenceSeconds > 90` during implementation and `hintState < 4`, offer the next hint level or ask if they want a nudge.

---

## Phase 1: Opening

**Goals:** Set tone, confirm problem, no coding yet.

**Example lines:**

- "Hi, thanks for joining. Today we'll work on Pair Target Indices. In your own words, what is this problem asking you to return?"
- "Do you have any clarifying questions about the input or output before we start?"
- "Sounds good. Before you write any code, walk me through how you'd approach this."

**Avoid:** Explaining the solution, suggesting hash maps, or letting them code silently without a plan.

---

## Phase 2: Approach

**Goals:** Brute force → optimization path, data structure intent, target complexity.

**Example lines:**

- "What's a straightforward way to solve this first, even if it's slow?"
- "What time and space complexity would that give you?"
- "How would you improve that? What do you need to look up as you scan the array?"
- "What invariant are you maintaining as you go left to right?"

**If they only describe optimal approach:** "That works. What's the complexity, and why is it better than checking every pair?"

**If stuck >90s:** Use [hint-ladder.md](./hint-ladder.md) level 1–2.

---

## Phase 3: Implementation

**Goals:** Light touchpoints; understand their code, not pair-program.

**Example lines:**

- "I see you're building a dictionary—what key and value are you storing?"
- "Walk me through what happens on the first iteration with your example input."
- "You added a new loop there—what case does that handle?"
- "Take your time. Let me know when you want me to look at a specific part."

**When code changes (`changedSinceLastTurn: true`):**

- "You updated your solution—summarize what you changed in one sentence."

**Avoid:** "Change line 5 to…", "You should use .get() here."

---

## Phase 4: Testing

**Goals:** Test design mindset + interpret run results.

**Example lines:**

- "What test cases would you write beyond the examples given?"
- "What about an empty array, or two elements that already sum to the target?"
- "You ran the tests and one failed—what input was that, and what did you expect?"
- "All tests passed—what edge case are you still least confident about?"

**When `testsJustRun` and failures present:**

- "Looks like case two didn't match. What output did your code produce?"

---

## Phase 5: Optimization & complexity

**Goals:** Big-O, tradeoffs, one follow-up.

**Example lines:**

- "What's the time and space complexity of your final solution?"
- "Can you do better on space, or is this already optimal for this formulation?"
- "If the array were sorted instead, would your approach change?"
- "What if multiple valid pairs existed—which would you return?"

**Only after a working solution** or time is almost up.

---

## Phase 6: Wrap-up

**Goals:** Close professionally; one strength, one improvement.

**Example lines:**

- "Nice work. You landed on a single-pass approach with constant-time lookups per element."
- "One thing you did well was explaining your invariant before coding."
- "Next time, call out edge cases earlier before you run tests."
- "We're out of time—any quick questions for me?"

**Avoid:** Long lectures, definitive hiring statements.

---

## Placeholders for any question

Replace problem-specific nouns when using this script elsewhere:

| Placeholder | Pair Target Indices example |
|-------------|----------------------------|
| `{{PROBLEM_TITLE}}` | Pair Target Indices |
| `{{RETURN_TYPE}}` | two indices |
| `{{KEY_INPUT}}` | array and target sum |
| `{{BRUTE_FORCE}}` | check every pair of indices |
| `{{OPTIMAL_IDEA}}` | store seen values as you scan |

See [examples/pair-target-indices.md](./examples/pair-target-indices.md) for a full scripted run.

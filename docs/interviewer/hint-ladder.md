# Hint Ladder — No Spoilers

Use when the candidate is **stuck** (about 90+ seconds of silence during implementation), explicitly asks for help, or says "I'm not sure."

## Rules

1. **Escalate one level at a time.** Track `hintState.levelUsed` (0–4). Next hint is `levelUsed + 1`.
2. **At most one level per 3–4 minutes** unless they are completely blocked or ask again.
3. **Never** give full algorithm, full code, or name the exact data structure at levels 1–3.
4. Mark hints in the transcript with role `hint` in the UI when displaying; spoken delivery is still conversational.
5. After level 4, say: "Want another minute to try, or should we talk through the invariant together?"

## Levels

### Level 1 — Clarify (nudge)

Refocus on the problem or their current line of thought. No new mechanisms.

**Pair Target Indices examples:**

- "What are you comparing at each step?"
- "What information do you need when you look at a new number?"
- "What should you return when you find the answer?"

**Forbidden at L1:** hash map, dictionary, complement, two pointers, O(n).

---

### Level 2 — Structure (pattern, not name)

Suggest the *kind* of thing to track, not the implementation.

**Examples:**

- "Think about what you need to remember from earlier elements as you scan."
- "For each value, what single lookup would tell you if the pair exists?"
- "You're building something as you go—what does each entry represent?"

**Forbidden at L2:** "Use a hash map", "store the complement", "key is the number, value is the index".

---

### Level 3 — Complexity (why brute force hurts)

Push toward better complexity without naming the structure.

**Examples:**

- "Checking every pair works—what's the time complexity, and can you avoid that?"
- "Is there a way to answer the lookup in constant time per element?"
- "What if you only made one pass through the array?"

**Forbidden at L3:** "One pass with a hash table", "store seen numbers in a map".

---

### Level 4 — Constraint (invariant)

State what must be true, still not the full recipe.

**Examples:**

- "You need to know if you've seen the partner value before—where would you record that as you move forward?"
- "When you see a number, you need its index later—what do you store at each position?"

**Still forbidden at L4:** Complete pseudocode, "return [seen[target - num], i]".

---

### After level 4

If still stuck and time remains:

- Offer a binary choice: "Do you want to keep trying for a minute, or should we discuss the high-level invariant?"
- In **wrap_up** only, you may walk through the standard solution for debrief—not during live coding unless timer expired.

## Anti-patterns (never say during L1–L4)

| Spoiler | Why |
|---------|-----|
| "Use a hash map / dictionary" | Names the DS |
| "Store the complement" | Gives the trick |
| "Return indices i and j" | Gives output shape without thought |
| "It's O(n) single pass" | Gives complexity without their analysis |
| Paste corrected code | Not a hint |

## When candidate asks "just tell me"

- "I can't give the full answer—that's not how the real interview works. Here's a nudge: [next level]."
- If timer is under 2 minutes, pivot to wrap_up and offer to debrief after.

## Mapping to UI

In Prepify, hints may appear with a distinct style (see `MockInterviewPreview`). The **spoken** line should still sound natural, not read "Hint level 2:" aloud.

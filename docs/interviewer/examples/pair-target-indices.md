# Example Run — Pair Target Indices (Two Sum)

**Problem:** Return two distinct indices whose values sum to `target`. Exactly one valid pair exists.

**Examples (from question bank):**

- `values = [2, 7, 11, 15], target = 9` → `[0, 1]`
- `values = [4, 5, 1], target = 6` → `[1, 2]`

**Session:** 20 minutes, Python, voice interviewer.

This script shows ideal **spoken** interviewer lines. Candidate lines are illustrative.

---

## 1. Opening (~0:00)

**Interviewer:**  
Hi, thanks for being here. Today we'll work on Pair Target Indices. In your own words, what do you need to return?

**Candidate:**  
Two indices in the array whose values add up to the target.

**Interviewer:**  
Right. Any clarifying questions about the inputs or the output format?

**Candidate:**  
Can the same index be used twice?

**Interviewer:**  
No, they have to be two different positions. When you're ready, talk me through how you'd approach it before you code.

---

## 2. Approach (~0:02)

**Candidate:**  
I could check every pair of indices and see if they sum to the target.

**Interviewer:**  
Okay. What's the time complexity of that approach?

**Candidate:**  
O(n squared), I think.

**Interviewer:**  
That's reasonable for the brute force. How would you try to improve that?

**Candidate:**  
Maybe remember what I've seen so I don't recheck old pairs.

**Interviewer:**  
What would you store as you scan, and what lookup do you need at each step?

**Candidate:**  
For each number, I need to know if target minus that number was seen before, and where.

**Interviewer:**  
Good. What complexity are you aiming for if that works in one pass?

**Candidate:**  
O(n) time, O(n) extra space for what I've seen.

**Interviewer:**  
Sounds good. Go ahead and implement it when you're ready.

---

## 3. Implementation (~0:06)

**Candidate:**  
*(codes quietly)*

**Interviewer:**  
*(after ~30s)* I see you're building a dictionary. What are the key and value?

**Candidate:**  
Key is the number, value is the index.

**Interviewer:**  
And when you see a new value, what do you check first?

**Candidate:**  
Whether target minus current value is already in the map.

**Interviewer:**  
What do you return when that happens?

**Candidate:**  
The stored index and the current index.

**Candidate:**  
*(long pause ~95s)*

**Interviewer (hint L1):**  
What are you comparing at each step when you look at a new number?

**Candidate:**  
Oh right, I'm checking the complement. I think I've got it.

---

## 4. Testing (~0:14)

**Interviewer:**  
Before you run more tests, what cases would you try besides the examples?

**Candidate:**  
Maybe two elements that sum to target, and a longer array.

**Interviewer:**  
What about duplicates in the array?

**Candidate:**  
The problem says one solution, so maybe not an issue, but I'd still think about it.

**Candidate:**  
*(runs tests — one fails)*

**Interviewer:**  
One case failed. What input was that, and what did you expect versus what you got?

**Candidate:**  
I returned the wrong order of indices on the second example.

**Interviewer:**  
Walk me through that case with your current code.

**Candidate:**  
*(fixes off-by-one in return order)*

**Interviewer:**  
Run them again when you're ready.

**Candidate:**  
Both passed now.

**Interviewer:**  
Good. What's an edge case you're still least confident about?

**Candidate:**  
Empty array—but constraints say length at least two.

---

## 5. Optimization (~0:17)

**Interviewer:**  
What's the time and space complexity of your final solution?

**Candidate:**  
O(n) time, one pass. O(n) space for the hash map.

**Interviewer:**  
Can you do better on space for this problem as stated?

**Candidate:**  
Not really if we need random lookup by value. Maybe O(1) space if the array were sorted and we used two pointers, but that's a different setup.

**Interviewer:**  
If multiple valid pairs existed, how would you decide which to return?

**Candidate:**  
The problem says exactly one, so I wouldn't worry. Otherwise I'd pick the first found or clarify with the interviewer.

---

## 6. Wrap-up (~0:19)

**Interviewer:**  
We're almost out of time. You ended with a single-pass hash map approach, O(n) time and space.

**Interviewer:**  
You explained the complement check clearly before you finished coding—that's a strength.

**Interviewer:**  
Next time, mention edge cases like empty or two-element arrays earlier when you discuss tests.

**Interviewer:**  
Any quick questions for me before we stop?

**Candidate:**  
No, that's good. Thanks.

**Interviewer:**  
Thanks for your time. Good practice today.

---

## Hint ladder usage in this run

| Time | Level | Line used |
|------|-------|-----------|
| ~0:10 | L1 | "What are you comparing at each step…" |

No L2–L4 needed—the candidate recovered after L1.

---

## Context snapshot (mid-implementation)

Example JSON fragment for the turn after "I see you're building a dictionary":

```json
{
  "session": { "phase": "implementation", "minutesRemaining": 11, "minutesTotal": 20, "language": "python" },
  "code": { "source": "def pair_target_indices(values, target):\n    seen = {}\n    ...", "changedSinceLastTurn": true },
  "tests": { "passed": 0, "total": 2 },
  "hintState": { "levelUsed": 0 },
  "signals": { "silenceSeconds": 8, "testsJustRun": false, "candidateAskedForHint": false }
}
```

---

## Dry-run checklist

- [ ] Opening asks for approach before code
- [ ] No "hash map" spoken before candidate mentions it
- [ ] Hint L1 does not name the data structure
- [ ] Testing phase references a failed run
- [ ] Optimization states O(n) time and space
- [ ] Wrap-up has one strength and one improvement

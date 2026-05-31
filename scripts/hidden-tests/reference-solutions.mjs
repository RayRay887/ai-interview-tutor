/** Reference solutions used to validate hidden tests at build time (not shipped to browser). */
export const referenceSolutions = {
  'pair-target-indices': `def pair_target_indices(values, target):
    seen = {}
    for i, v in enumerate(values):
        need = target - v
        if need in seen:
            return [seen[need], i]
        seen[v] = i
    return []`,
  'zero-sum-triplets': `def zero_sum_triplets(values):
    values.sort()
    res = []
    n = len(values)
    for i in range(n):
        if i > 0 and values[i] == values[i - 1]:
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = values[i] + values[lo] + values[hi]
            if s == 0:
                res.append([values[i], values[lo], values[hi]])
                while lo < hi and values[lo] == values[lo + 1]:
                    lo += 1
                while lo < hi and values[hi] == values[hi - 1]:
                    hi -= 1
                lo += 1
                hi -= 1
            elif s < 0:
                lo += 1
            else:
                hi -= 1
    return res`,
  'duplicate-value-detector': `def duplicate_value_detector(values):
    seen = set()
    for v in values:
        if v in seen:
            return True
        seen.add(v)
    return False`,
  'best-single-trade-profit': `def best_single_trade_profit(prices):
    if not prices:
        return 0
    best = 0
    low = prices[0]
    for p in prices[1:]:
        best = max(best, p - low)
        low = min(low, p)
    return best`,
  'maximum-subarray-sum': `def maximum_subarray_sum(values):
    best = values[0]
    cur = values[0]
    for v in values[1:]:
        cur = max(v, cur + v)
        best = max(best, cur)
    return best`,
  'product-except-self': `def product_except_self(values):
    n = len(values)
    out = [1] * n
    prefix = 1
    for i in range(n):
        out[i] = prefix
        prefix *= values[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        out[i] *= suffix
        suffix *= values[i]
    return out`,
  'longest-consecutive-run': `def longest_consecutive_run(values):
    nums = set(values)
    best = 0
    for n in nums:
        if n - 1 in nums:
            continue
        length = 1
        while n + length in nums:
            length += 1
        best = max(best, length)
    return best`,
  'widest-container-area': `def widest_container_area(heights):
    lo, hi = 0, len(heights) - 1
    best = 0
    while lo < hi:
        best = max(best, min(heights[lo], heights[hi]) * (hi - lo))
        if heights[lo] < heights[hi]:
            lo += 1
        else:
            hi -= 1
    return best`,
  'matching-bracket-validator': `def matching_bracket_validator(text):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for ch in text:
        if ch in '([{':
            stack.append(ch)
        elif ch in ')]}':
            if not stack or stack.pop() != pairs[ch]:
                return False
    return len(stack) == 0`,
  'longest-unique-substring': `def longest_unique_substring(text):
    last = {}
    start = 0
    best = 0
    for i, ch in enumerate(text):
        if ch in last and last[ch] >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best`,
}

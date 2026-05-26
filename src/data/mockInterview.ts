export const terminalCode = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`

export const aiMessages = [
  {
    role: 'interviewer' as const,
    text: "Walk me through your approach before you code. What's the time complexity you're aiming for?",
  },
  {
    role: 'hint' as const,
    text: 'Consider using a hash map to store complements — O(n) single pass.',
  },
]

export const testCases = [
  { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', status: 'passed' as const },
  { input: 'nums = [3,2,4], target = 6', output: '[1, 2]', status: 'passed' as const },
  { input: 'nums = [3,3], target = 6', output: '[0, 1]', status: 'running' as const },
]


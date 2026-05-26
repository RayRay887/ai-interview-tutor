export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Question {
  id: string
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  category: string
  duration: string
  featured?: boolean
  starterCode: string
  examples: { input: string; output: string }[]
}

export const questions: Question[] = [
  {
    id: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.',
    difficulty: 'Easy',
    category: 'Arrays & Hashmaps',
    duration: '25 min',
    featured: true,
    starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]' },
    ],
  },
  {
    id: '2',
    slug: 'three-sum',
    title: 'Three Sum',
    description:
      'Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, j != k, and nums[i] + nums[j] + nums[k] == 0.',
    difficulty: 'Medium',
    category: 'Arrays & Hashmaps',
    duration: '40 min',
    featured: true,
    starterCode: `def three_sum(nums: list[int]) -> list[list[int]]:
    # Your code here
    pass`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
      { input: 'nums = [0,1,1]', output: '[]' },
    ],
  },
  {
    id: '3',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed in the correct order.',
    difficulty: 'Easy',
    category: 'Stacks',
    duration: '20 min',
    featured: true,
    starterCode: `def is_valid(s: str) -> bool:
    # Your code here
    pass`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
  },
  {
    id: '4',
    slug: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    category: 'Sliding Window',
    duration: '35 min',
    featured: true,
    starterCode: `def length_of_longest_substring(s: str) -> int:
    # Your code here
    pass`,
    examples: [
      { input: 's = "abcabcbb"', output: '3' },
      { input: 's = "bbbbb"', output: '1' },
    ],
  },
  {
    id: '5',
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals.',
    difficulty: 'Medium',
    category: 'Arrays & Hashmaps',
    duration: '35 min',
    starterCode: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Your code here
    pass`,
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
    ],
  },
  {
    id: '6',
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    description:
      'Given the head of a singly linked list, reverse the list and return the reversed list.',
    difficulty: 'Easy',
    category: 'Linked Lists',
    duration: '25 min',
    starterCode: `def reverse_list(head):
    # Your code here
    pass`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
    ],
  },
  {
    id: '7',
    slug: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    description:
      'Given the root of a binary tree, return the level order traversal of its nodes\' values (i.e., from left to right, level by level).',
    difficulty: 'Medium',
    category: 'Trees & Graphs',
    duration: '35 min',
    starterCode: `def level_order(root) -> list[list[int]]:
    # Your code here
    pass`,
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
    ],
  },
  {
    id: '8',
    slug: 'coin-change',
    title: 'Coin Change',
    description:
      'You are given an integer array coins representing coin denominations and an integer amount. Return the fewest number of coins needed to make up that amount.',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    duration: '40 min',
    starterCode: `def coin_change(coins: list[int], amount: int) -> int:
    # Your code here
    pass`,
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3' },
    ],
  },
  {
    id: '9',
    slug: 'number-of-islands',
    title: 'Number of Islands',
    description:
      'Given an m x n 2D binary grid which represents a map of "1"s (land) and "0"s (water), return the number of islands.',
    difficulty: 'Medium',
    category: 'Trees & Graphs',
    duration: '40 min',
    starterCode: `def num_islands(grid: list[list[str]]) -> int:
    # Your code here
    pass`,
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["1","0","1"]]', output: '3' },
    ],
  },
  {
    id: '10',
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    description:
      'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    duration: '20 min',
    starterCode: `def climb_stairs(n: int) -> int:
    # Your code here
    pass`,
    examples: [
      { input: 'n = 3', output: '3' },
      { input: 'n = 5', output: '8' },
    ],
  },
]

export const featuredQuestions = questions.filter((q) => q.featured)

export function getQuestionBySlug(slug: string): Question | undefined {
  return questions.find((q) => q.slug === slug)
}

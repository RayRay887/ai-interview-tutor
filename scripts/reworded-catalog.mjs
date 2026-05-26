import { problem } from './catalog/helpers.mjs'

/** Prepify-original problems (reworded; same concepts, not third-party copy). */
const allProblems = [
  problem({
    title: 'Pair Target Indices',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    featured: true,
    description:
      'You receive a list of integers and a target total. Return the two distinct indices whose values add up to the target. Exactly one valid pair exists, and you may not reuse the same index twice.',
    examples: [
      { input: 'values = [3, 8, 1, 6], target = 9', output: '[0, 3]' },
      { input: 'values = [4, 5, 1], target = 6', output: '[1, 2]' },
    ],
    starterCode: `def pair_target_indices(values: list[int], target: int) -> list[int]:
    # Your code here
    pass`,
  }),
  problem({
    title: 'Zero-Sum Triplets',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    featured: true,
    description:
      'From an integer list, find every unique triplet of indices whose values sum to zero. The solution set must not contain duplicate triplets.',
    examples: [
      { input: 'values = [-1, 0, 1, 2, -1, -4]', output: '[[-1,-1,2],[-1,0,1]]' },
    ],
    starterCode: `def zero_sum_triplets(values: list[int]) -> list[list[int]]:
    # Your code here
    pass`,
  }),
  problem({
    title: 'Duplicate Value Detector',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Determine whether any value appears at least twice in the given integer list.',
    examples: [{ input: 'values = [1, 2, 3, 1]', output: 'true' }],
  }),
  problem({
    title: 'Letter Multiset Match',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Given two strings, decide if one string is an anagram of the other (same letters, same counts).',
    examples: [{ input: 'a = "listen", b = "silent"', output: 'true' }],
  }),
  problem({
    title: 'Anagram Buckets',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Group a list of words so that words in the same group are anagrams of each other. Return the groups in any order.',
    examples: [
      {
        input: 'words = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
    ],
  }),
  problem({
    title: 'Top Frequency Values',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Return the k integers that appear most often in the array. You may return the answer in any order.',
    examples: [{ input: 'values = [1,1,1,2,2,3], k = 2', output: '[1, 2]' }],
  }),
  problem({
    title: 'Product Except Self',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Build an output array where each position holds the product of all input values except the value at that position. Solve without division and in O(n) time.',
    examples: [
      { input: 'values = [1, 2, 3, 4]', output: '[24, 12, 8, 6]' },
    ],
  }),
  problem({
    title: 'Longest Consecutive Run',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Given unsorted integers, return the length of the longest consecutive increasing sequence (values differ by 1).',
    examples: [{ input: 'values = [100, 4, 200, 1, 3, 2]', output: '4' }],
  }),
  problem({
    title: 'Subarray Sum Target',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Count how many contiguous subarrays have a sum equal to the given target k.',
    examples: [{ input: 'values = [1, 1, 1], k = 2', output: '2' }],
  }),
  problem({
    title: 'Overlap Merger',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Each interval is [start, end]. Merge all overlapping intervals and return the merged list sorted by start.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
      },
    ],
  }),
  problem({
    title: 'Rotated Array Minimum',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'A sorted array was rotated at an unknown pivot. Find the smallest element in O(log n) time.',
    examples: [{ input: 'values = [3, 4, 5, 1, 2]', output: '1' }],
  }),
  problem({
    title: 'Search Rotated Sorted Array',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Search for a target value in a rotated sorted array with distinct elements. Return its index or -1.',
    examples: [{ input: 'values = [4,5,6,7,0,1,2], target = 0', output: '4' }],
  }),
  problem({
    title: 'Widest Container Area',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Given vertical line heights, pick two lines that together with the x-axis form a container. Maximize the water volume held.',
    examples: [{ input: 'heights = [1,8,6,2,5,4,8,3,7]', output: '49' }],
  }),
  problem({
    title: 'Rain Trap Volume',
    category: 'Arrays & Hashmaps',
    difficulty: 'Hard',
    description:
      'Each bar has a height. After raining, water sits between bars. Compute total trapped water units.',
    examples: [{ input: 'heights = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
  }),
  problem({
    title: 'Best Single Trade Profit',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Daily stock prices in order. You may buy once and sell once later. Return maximum profit, or 0 if none.',
    examples: [{ input: 'prices = [7, 1, 5, 3, 6, 4]', output: '5' }],
  }),
  problem({
    title: 'Maximum Subarray Sum',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Find the contiguous subarray with the largest sum and return that sum.',
    examples: [{ input: 'values = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6' }],
  }),
  problem({
    title: 'Majority Vote Threshold',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Return the element that appears more than n/2 times in the list. Assume such an element always exists.',
    examples: [{ input: 'values = [3, 2, 3]', output: '3' }],
  }),
  problem({
    title: 'Shift Zeros to End',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Reorder the array in-place so all non-zero values come first, preserving their relative order.',
    examples: [{ input: 'values = [0, 1, 0, 3, 12]', output: '[1, 3, 12, 0, 0]' }],
  }),
  problem({
    title: 'Sorted Squares',
    category: 'Arrays & Hashmaps',
    difficulty: 'Easy',
    description:
      'Given a sorted integer array, return a new sorted array of the squares of each value.',
    examples: [{ input: 'values = [-4, -1, 0, 3, 10]', output: '[0, 1, 9, 16, 100]' }],
  }),
  problem({
    title: 'Dutch Flag Sort',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Sort an array containing only 0, 1, and 2 in-place without using the built-in sort.',
    examples: [{ input: 'values = [2, 0, 2, 1, 1, 0]', output: '[0, 0, 1, 1, 2, 2]' }],
  }),
  problem({
    title: 'Matching Bracket Validator',
    category: 'Stacks',
    difficulty: 'Easy',
    featured: true,
    description:
      'Given a string of brackets (), {}, and [], determine whether every opener has a correct closer in the right order.',
    examples: [
      { input: 'text = "()[]{}"', output: 'true' },
      { input: 'text = "(]"', output: 'false' },
    ],
    starterCode: `def matching_bracket_validator(text: str) -> bool:
    # Your code here
    pass`,
  }),
  problem({
    title: 'Minimum Stack',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time per operation.',
    examples: [{ input: 'push(2), push(0), getMin()', output: '0' }],
  }),
  problem({
    title: 'Postfix Evaluator',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Evaluate an arithmetic expression in reverse Polish notation (operands then operator).',
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: '9' },
    ],
  }),
  problem({
    title: 'Warmup Day Counts',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Daily temperatures list: for each day, how many days until a warmer temperature? Use 0 if none.',
    examples: [
      { input: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]', output: '[1,1,4,2,1,1,0,0]' },
    ],
  }),
  problem({
    title: 'Nested String Decoder',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Decode strings like "3[a2[c]]" into "accaccacc" using k[encoded] repetition rules.',
    examples: [{ input: 'encoded = "3[a2[c]]"', output: '"accaccacc"' }],
  }),
  problem({
    title: 'Largest Histogram Area',
    category: 'Stacks',
    difficulty: 'Hard',
    description:
      'Given bar heights in a histogram, find the largest rectangle area you can form.',
    examples: [{ input: 'heights = [2, 1, 5, 6, 2, 3]', output: '10' }],
  }),
  problem({
    title: 'Expression Calculator',
    category: 'Stacks',
    difficulty: 'Hard',
    description:
      'Evaluate a string expression with non-negative integers, +, -, parentheses, and spaces.',
    examples: [{ input: 'expr = "1 + (2 + 3)"', output: '6' }],
  }),
  problem({
    title: 'Longest Unique Substring',
    category: 'Sliding Window',
    difficulty: 'Medium',
    featured: true,
    description:
      'Find the length of the longest substring that contains no repeated characters.',
    examples: [
      { input: 'text = "abcabcbb"', output: '3' },
      { input: 'text = "bbbbb"', output: '1' },
    ],
    starterCode: `def longest_unique_substring(text: str) -> int:
    # Your code here
    pass`,
  }),
  problem({
    title: 'Window Character Replacement',
    category: 'Sliding Window',
    difficulty: 'Medium',
    description:
      'You may replace at most k characters in a substring. Return the longest substring you can make with all identical letters.',
    examples: [{ input: 'text = "AABABBA", k = 1', output: '4' }],
  }),
  problem({
    title: 'Permutation Window Check',
    category: 'Sliding Window',
    difficulty: 'Medium',
    description:
      'Given strings s1 and s2, return true if s2 contains a contiguous substring that is a permutation of s1.',
    examples: [{ input: 's1 = "ab", s2 = "eidbaooo"', output: 'true' }],
  }),
  problem({
    title: 'Minimum Cover Substring',
    category: 'Sliding Window',
    difficulty: 'Hard',
    description:
      'In string s, find the shortest substring that contains every character from string t at least once.',
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' },
    ],
  }),
  problem({
    title: 'Sliding Window Peak',
    category: 'Sliding Window',
    difficulty: 'Hard',
    description:
      'For each sliding window of size k in an array, return the maximum value in that window.',
    examples: [
      { input: 'values = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]' },
    ],
  }),
  problem({
    title: 'Min Subarray Sum At Least K',
    category: 'Sliding Window',
    difficulty: 'Medium',
    description:
      'Return the minimal length of a contiguous subarray whose sum is greater than or equal to target.',
    examples: [{ input: 'values = [2, 3, 1, 2, 4, 3], target = 7', output: '2' }],
  }),
  problem({
    title: 'Reverse Singly Chain',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description:
      'Reverse a singly linked list and return the new head.',
    examples: [{ input: 'chain = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]' }],
  }),
  problem({
    title: 'Merge Two Sorted Chains',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description:
      'Merge two sorted linked lists into one sorted list and return its head.',
    examples: [{ input: 'a = [1,2,4], b = [1,3,4]', output: '[1,1,2,3,4,4]' }],
  }),
  problem({
    title: 'Cycle Entry Finder',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description:
      'Detect whether a linked list has a cycle. If yes, return the node where the cycle begins; otherwise null.',
    examples: [{ input: 'chain with cycle at index 1', output: 'node at index 1' }],
  }),
  problem({
    title: 'Nth Node From Tail',
    category: 'Linked Lists',
    difficulty: 'Medium',
    description:
      'Remove the node n positions from the end of the list and return the head.',
    examples: [{ input: 'chain = [1,2,3,4,5], n = 2', output: '[1,2,3,5]' }],
  }),
  problem({
    title: 'Digit List Addition',
    category: 'Linked Lists',
    difficulty: 'Medium',
    description:
      'Two non-empty linked lists store digits in reverse order. Add them and return the sum as a linked list.',
    examples: [{ input: 'a = [2,4,3], b = [5,6,4]', output: '[7,0,8]' }],
  }),
  problem({
    title: 'Reorder Half Interleave',
    category: 'Linked Lists',
    difficulty: 'Medium',
    description:
      'Reorder L0→L1→…→Ln-1→Ln into L0→Ln→L1→Ln-1→… without allocating a new list.',
    examples: [{ input: 'chain = [1,2,3,4]', output: '[1,4,2,3]' }],
  }),
  problem({
    title: 'Merge K Sorted Chains',
    category: 'Linked Lists',
    difficulty: 'Hard',
    description:
      'Merge k sorted linked lists into one sorted list. Return its head.',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
      },
    ],
  }),
  problem({
    title: 'Mirror Binary Tree',
    category: 'Trees & Graphs',
    difficulty: 'Easy',
    description:
      'Swap left and right children at every node to produce the mirror image of the binary tree.',
    examples: [{ input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }],
  }),
  problem({
    title: 'Tree Depth Measure',
    category: 'Trees & Graphs',
    difficulty: 'Easy',
    description:
      'Return the maximum number of nodes along any root-to-leaf path (tree depth).',
    examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '3' }],
  }),
  problem({
    title: 'Symmetric Tree Check',
    category: 'Trees & Graphs',
    difficulty: 'Easy',
    description:
      'Determine whether a binary tree is a mirror of itself around its center.',
    examples: [{ input: 'root = [1,2,2,3,4,4,3]', output: 'true' }],
  }),
  problem({
    title: 'Level Order Layers',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Return node values grouped by depth level, left to right within each level.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
    ],
  }),
  problem({
    title: 'Search Tree Validator',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Verify that a binary tree satisfies the binary search tree ordering property everywhere.',
    examples: [{ input: 'root = [2,1,3]', output: 'true' }],
  }),
  problem({
    title: 'Kth Smallest in Search Tree',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'In a binary search tree, return the k-th smallest node value (1-indexed).',
    examples: [{ input: 'root = [3,1,4,null,2], k = 1', output: '1' }],
  }),
  problem({
    title: 'Land Region Counter',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'A grid uses "1" for land and "0" for water. Count connected land regions (4-directional).',
    examples: [
      {
        input: 'grid = [["1","1","0"],["0","1","0"],["1","0","1"]]',
        output: '3',
      },
    ],
  }),
  problem({
    title: 'Course Prerequisite Order',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'There are numCourses labeled 0..n-1 and prerequisite pairs. Return a valid order to take all courses, or empty if impossible.',
    examples: [
      { input: 'numCourses = 2, prereqs = [[1,0]]', output: '[0, 1]' },
    ],
  }),
  problem({
    title: 'Graph Connectivity Check',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Given n nodes and undirected edges, decide if the graph forms a single connected tree (exactly n-1 edges, connected).',
    examples: [{ input: 'n = 5, edges = [[0,1],[1,2],[2,3],[3,4]]', output: 'true' }],
  }),
  problem({
    title: 'Rot Spread Minutes',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'A grid has fresh oranges (1), rotten (2), and empty (0). Each minute rot spreads to adjacent fresh cells. Return minutes until none fresh, or -1.',
    examples: [{ input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' }],
  }),
  problem({
    title: 'Word Ladder Length',
    category: 'Trees & Graphs',
    difficulty: 'Hard',
    description:
      'Transform beginWord to endWord by changing one letter at a time, using only words from the dictionary. Return shortest sequence length.',
    examples: [
      {
        input: 'begin = "hit", end = "cog", dict = ["hot","dot","dog","lot","log","cog"]',
        output: '5',
      },
    ],
  }),
  problem({
    title: 'Staircase Ways',
    category: 'Dynamic Programming',
    difficulty: 'Easy',
    description:
      'You can climb 1 or 2 steps at a time. Given n steps, how many distinct ways reach the top?',
    examples: [
      { input: 'n = 3', output: '3' },
      { input: 'n = 5', output: '8' },
    ],
  }),
  problem({
    title: 'House Robbery Max',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Each house has a cash value. Rob non-adjacent houses to maximize total loot.',
    examples: [{ input: 'values = [2, 7, 9, 3, 1]', output: '12' }],
  }),
  problem({
    title: 'Coin Minimum Count',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Given coin denominations and an amount, return the fewest coins needed, or -1 if impossible.',
    examples: [{ input: 'coins = [1, 2, 5], amount = 11', output: '3' }],
  }),
  problem({
    title: 'Dictionary Word Split',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Can string s be segmented into space-separated words that all appear in the given dictionary?',
    examples: [
      { input: 's = "leetcode", dict = ["leet","code"]', output: 'true' },
    ],
  }),
  problem({
    title: 'Longest Increasing Subsequence',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Return the length of the longest strictly increasing subsequence (not necessarily contiguous).',
    examples: [{ input: 'values = [10, 9, 2, 5, 3, 7, 101, 18]', output: '4' }],
  }),
  problem({
    title: 'Equal Partition Subset',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Can you partition the integer array into two subsets with equal sum?',
    examples: [{ input: 'values = [1, 5, 11, 5]', output: 'true' }],
  }),
  problem({
    title: 'Edit Distance',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    description:
      'Given two strings word1 and word2, return the minimum insertions, deletions, or replacements to transform word1 into word2.',
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: '3' },
    ],
  }),
  problem({
    title: 'Grid Path Count',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Count unique paths from top-left to bottom-right of an m×n grid, moving only right or down.',
    examples: [{ input: 'rows = 3, cols = 7', output: '28' }],
  }),
  problem({
    title: 'All Subsets Generator',
    category: 'Backtracking',
    difficulty: 'Medium',
    description:
      'Return all possible subsets of the distinct integers in nums (the power set).',
    examples: [{ input: 'values = [1, 2, 3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' }],
  }),
  problem({
    title: 'Permutation Builder',
    category: 'Backtracking',
    difficulty: 'Medium',
    description:
      'Given distinct integers, return all possible permutations in any order.',
    examples: [
      { input: 'values = [1, 2, 3]', output: '[[1,2,3],[1,3,2],[2,1,3],...]' },
    ],
  }),
  problem({
    title: 'Combination Target Sum',
    category: 'Backtracking',
    difficulty: 'Medium',
    description:
      'Find all unique combinations from candidates where chosen numbers sum to target. Each number may be used unlimited times.',
    examples: [
      {
        input: 'candidates = [2,3,6,7], target = 7',
        output: '[[2,2,3],[7]]',
      },
    ],
  }),
  problem({
    title: 'Grid Word Path',
    category: 'Backtracking',
    difficulty: 'Medium',
    description:
      'Given a 2D board and a word, return whether the word exists by moving adjacently without reusing a cell.',
    examples: [
      {
        input: 'board = [["A","B"],["C","D"]], word = "ABDC"',
        output: 'false',
      },
    ],
  }),
  problem({
    title: 'N-Queens Layout',
    category: 'Backtracking',
    difficulty: 'Hard',
    description:
      'Place n queens on an n×n board so no two share a row, column, or diagonal. Return all distinct solutions.',
    examples: [{ input: 'n = 4', output: '2 distinct boards' }],
  }),
  problem({
    title: 'Kth Largest Picker',
    category: 'Heaps',
    difficulty: 'Medium',
    description:
      'Return the k-th largest element in an unsorted array (not the k-th distinct value).',
    examples: [{ input: 'values = [3,2,1,5,6,4], k = 2', output: '5' }],
  }),
  problem({
    title: 'Closest Points to Origin',
    category: 'Heaps',
    difficulty: 'Medium',
    description:
      'Given points [x, y] on a plane, return the k points closest to (0, 0).',
    examples: [{ input: 'points = [[1,3],[-2,2]], k = 1', output: '[[-2,2]]' }],
  }),
  problem({
    title: 'Task Cooldown Schedule',
    category: 'Heaps',
    difficulty: 'Medium',
    description:
      'Each task label takes one unit; identical tasks need n units cooldown. Return minimum time slots to finish all tasks.',
    examples: [{ input: 'tasks = ["A","A","A","B","B","B"], n = 2', output: '8' }],
  }),
  problem({
    title: 'Running Median Stream',
    category: 'Heaps',
    difficulty: 'Hard',
    description:
      'Design a structure that supports addNum and findMedian for a stream of integers.',
    examples: [{ input: 'add(1), add(2), findMedian(), add(3)', output: '1.5 then 2' }],
  }),
  problem({
    title: 'Sorted Array Lookup',
    category: 'Binary Search',
    difficulty: 'Easy',
    description:
      'Given a sorted array of distinct integers and a target, return the index of target or -1.',
    examples: [{ input: 'values = [-1,0,3,5,9,12], target = 9', output: '4' }],
  }),
  problem({
    title: 'Matrix Sorted Search',
    category: 'Binary Search',
    difficulty: 'Medium',
    description:
      'Search for a value in an m×n matrix where each row and column is sorted ascending.',
    examples: [{ input: 'matrix = [[1,4,7],[10,11,16]], target = 10', output: 'true' }],
  }),
  problem({
    title: 'Banana Eating Pace',
    category: 'Binary Search',
    difficulty: 'Medium',
    description:
      'Koko eats piles of bananas within h hours, choosing a fixed hourly rate. Find the minimum integer eating speed k.',
    examples: [{ input: 'piles = [3,6,7,11], h = 8', output: '4' }],
  }),
  problem({
    title: 'Median of Two Sorted Lists',
    category: 'Binary Search',
    difficulty: 'Hard',
    description:
      'Two sorted arrays nums1 and nums2. Return the median of the combined sorted sequence in O(log(m+n)) time.',
    examples: [{ input: 'a = [1,3], b = [2]', output: '2.0' }],
  }),
  problem({
    title: 'Reach End Jump Game',
    category: 'Greedy',
    difficulty: 'Medium',
    description:
      'Each index stores max jump length from that spot. Return whether you can reach the last index from index 0.',
    examples: [{ input: 'jumps = [2, 3, 1, 1, 4]', output: 'true' }],
  }),
  problem({
    title: 'Minimum Reach Jumps',
    category: 'Greedy',
    difficulty: 'Medium',
    description:
      'Return the minimum number of jumps to reach the last index (you may jump at most jumps[i] steps).',
    examples: [{ input: 'jumps = [2, 3, 1, 1, 4]', output: '2' }],
  }),
  problem({
    title: 'Gas Station Circuit',
    category: 'Greedy',
    difficulty: 'Medium',
    description:
      'A circular route has gas[i] fuel and cost[i] to reach next station. Return the starting index if a full circuit is possible, else -1.',
    examples: [{ input: 'gas = [1,2,3,4,5], cost = [3,4,5,1,2]', output: '3' }],
  }),
  problem({
    title: 'Palindrome Phrase Check',
    category: 'Strings',
    difficulty: 'Easy',
    description:
      'After considering only alphanumeric characters and ignoring case, decide if the phrase reads the same forward and backward.',
    examples: [{ input: 'phrase = "A man, a plan, a canal: Panama"', output: 'true' }],
  }),
  problem({
    title: 'Longest Palindrome Length',
    category: 'Strings',
    difficulty: 'Easy',
    description:
      'Using characters from string s, what is the length of the longest palindrome you can build (rearranging allowed)?',
    examples: [{ input: 'text = "abccccdd"', output: '7' }],
  }),
  problem({
    title: 'Needle in Haystack',
    category: 'Strings',
    difficulty: 'Easy',
    description:
      'Return the index of the first occurrence of needle in haystack, or -1 if needle is not a substring.',
    examples: [{ input: 'haystack = "sadbutsad", needle = "sad"', output: '0' }],
  }),
  problem({
    title: 'Digit Array Plus One',
    category: 'Math',
    difficulty: 'Easy',
    description:
      'A large non-negative integer is stored as an array of digits (most significant first). Add one and return the new digit array.',
    examples: [{ input: 'digits = [1, 2, 3]', output: '[1, 2, 4]' }],
  }),
  problem({
    title: 'Integer Square Root',
    category: 'Math',
    difficulty: 'Easy',
    description:
      'Given non-negative x, return the floor of its square root without using built-in exponent helpers.',
    examples: [{ input: 'x = 8', output: '2' }],
  }),
  problem({
    title: 'Happy Number Cycle',
    category: 'Math',
    difficulty: 'Easy',
    description:
      'Repeatedly replace n with the sum of squares of its digits. Return true if this process eventually reaches 1.',
    examples: [{ input: 'n = 19', output: 'true' }],
  }),
  problem({
    title: 'Lone Element Finder',
    category: 'Bit Manipulation',
    difficulty: 'Easy',
    description:
      'Every element appears twice except one. Find that single element using linear time and constant extra space.',
    examples: [{ input: 'values = [4, 1, 2, 1, 2]', output: '4' }],
  }),
  problem({
    title: 'Count Set Bits',
    category: 'Bit Manipulation',
    difficulty: 'Easy',
    description:
      'Return the number of 1 bits in the binary representation of a non-negative integer.',
    examples: [{ input: 'n = 11', output: '3' }],
  }),
  problem({
    title: 'Missing Sequence Value',
    category: 'Bit Manipulation',
    difficulty: 'Easy',
    description:
      'An array contains n distinct values from 0 to n inclusive but one value is missing. Find it.',
    examples: [{ input: 'values = [3, 0, 1]', output: '2' }],
  }),
  problem({
    title: 'Add Without Plus',
    category: 'Bit Manipulation',
    difficulty: 'Medium',
    description:
      'Compute a + b for integers a and b without using + or - operators.',
    examples: [{ input: 'a = 5, b = 3', output: '8' }],
  }),
  problem({
    title: 'Key-Value Map Design',
    category: 'Design',
    difficulty: 'Easy',
    description:
      'Implement a hash map with put(key, value), get(key), and remove(key) in average O(1) time.',
    examples: [{ input: 'put(1,1), get(1), remove(1)', output: '1 then null' }],
  }),
  problem({
    title: 'Recent Access Cache',
    category: 'Design',
    difficulty: 'Medium',
    description:
      'Design an LRU cache with fixed capacity supporting get and put in O(1) average time.',
    examples: [{ input: 'capacity = 2, put(1,1), put(2,2), get(1)', output: '1' }],
  }),
  problem({
    title: 'Prefix Word Tree',
    category: 'Design',
    difficulty: 'Medium',
    description:
      'Implement a trie supporting insert(word), search(word), and startsWith(prefix).',
    examples: [
      { input: 'insert("apple"), search("app")', output: 'false' },
    ],
  }),
  problem({
    title: 'Hit Counter Window',
    category: 'Design',
    difficulty: 'Medium',
    description:
      'Count hits in the past 5 minutes (300 seconds). Each hit(timestamp) records an event; getHits returns recent count.',
    examples: [{ input: 'hit(1), hit(2), getHits(300)', output: '2' }],
  }),
  problem({
    title: 'Four Value Target Sum',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Find all unique quadruplets in the array that sum to target.',
    examples: [
      {
        input: 'values = [1,0,-1,0,-2,2], target = 0',
        output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]',
      },
    ],
  }),
  problem({
    title: 'Sudoku Board Validator',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Determine if a partially filled 9×9 Sudoku board is valid (no duplicate digits in any row, column, or 3×3 box).',
    examples: [{ input: 'partial 9x9 board', output: 'true or false' }],
  }),
  problem({
    title: 'Spiral Matrix Walk',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Return all elements of an m×n matrix in clockwise spiral order.',
    examples: [
      {
        input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]',
        output: '[1,2,3,6,9,8,7,4,5]',
      },
    ],
  }),
  problem({
    title: 'Balanced Parentheses Generator',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Given n pairs of parentheses, generate all combinations of well-formed strings.',
    examples: [{ input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]' }],
  }),
  problem({
    title: 'Car Fleet Arrival',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Cars at positions with speeds reach a target. Count how many fleets arrive (faster cars catch slower ones).',
    examples: [
      { input: 'target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]', output: '3' },
    ],
  }),
  problem({
    title: 'Two Basket Fruit Pick',
    category: 'Sliding Window',
    difficulty: 'Medium',
    description:
      'Each tree has a fruit type. You have two baskets (one type each). Pick a contiguous stretch with at most two types; maximize length.',
    examples: [{ input: 'fruits = [1,2,1,2,3]', output: '4' }],
  }),
  problem({
    title: 'Palindrome Chain Check',
    category: 'Linked Lists',
    difficulty: 'Easy',
    description:
      'Determine whether a singly linked list reads the same forward and backward.',
    examples: [{ input: 'chain = [1,2,2,1]', output: 'true' }],
  }),
  problem({
    title: 'Tree Path Target Sum',
    category: 'Trees & Graphs',
    difficulty: 'Easy',
    description:
      'Return true if the binary tree has a root-to-leaf path whose node values sum to target.',
    examples: [{ input: 'root = [5,4,8,11,null,13,4,7,2,1], target = 22', output: 'true' }],
  }),
  problem({
    title: 'Right Side Tree View',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Return the values visible when viewing the binary tree from the right side (top to bottom).',
    examples: [{ input: 'root = [1,2,3,null,5,null,4]', output: '[1,3,4]' }],
  }),
  problem({
    title: 'Decode Digit Message',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'A message uses 1→A, 2→B, …, 26→Z. Count how many ways the digit string can be decoded.',
    examples: [{ input: 'digits = "226"', output: '3' }],
  }),
  problem({
    title: 'Common Subsequence Length',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    description:
      'Return the length of the longest subsequence common to both strings (characters need not be contiguous).',
    examples: [{ input: 'a = "abcde", b = "ace"', output: '3' }],
  }),
  problem({
    title: 'Phone Keypad Combos',
    category: 'Backtracking',
    difficulty: 'Medium',
    description:
      'Given digits 2-9, return all letter combinations the digits could represent on a phone keypad.',
    examples: [{ input: 'digits = "23"', output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' }],
  }),
  problem({
    title: 'Smallest Range Cover',
    category: 'Heaps',
    difficulty: 'Hard',
    description:
      'From k sorted lists, find the smallest range [min, max] that includes at least one number from each list.',
    examples: [{ input: 'lists = [[4,10,15,24],[0,9,12,20],[5,18,22,30]]', output: '[20,24]' }],
  }),
  problem({
    title: 'Insert Search Position',
    category: 'Binary Search',
    difficulty: 'Easy',
    description:
      'In a sorted array of distinct integers, return the index where target would be inserted to keep order.',
    examples: [{ input: 'values = [1,3,5,6], target = 5', output: '2' }],
  }),
  problem({
    title: 'Label Partition Sizes',
    category: 'Greedy',
    difficulty: 'Medium',
    description:
      'Partition a string into as few parts as possible so each letter appears in at most one part. Return part sizes.',
    examples: [{ input: 'text = "ababcbacadefegdehijhklij"', output: '[9, 7, 8]' }],
  }),
  problem({
    title: 'Version String Compare',
    category: 'Strings',
    difficulty: 'Medium',
    description:
      'Compare two version strings like "1.01" vs "1.001". Return -1, 0, or 1 if first is older, equal, or newer.',
    examples: [{ input: 'v1 = "1.2", v2 = "1.10"', output: '-1' }],
  }),
  problem({
    title: 'Prime Count Below N',
    category: 'Math',
    difficulty: 'Medium',
    description:
      'Return how many prime numbers are strictly less than n.',
    examples: [{ input: 'n = 10', output: '4' }],
  }),
  problem({
    title: 'Reverse Bit Pattern',
    category: 'Bit Manipulation',
    difficulty: 'Easy',
    description:
      'Reverse the bits of a 32-bit unsigned integer and return the result.',
    examples: [{ input: 'n = 43261596', output: '964176192' }],
  }),
  problem({
    title: 'Queue From Two Stacks',
    category: 'Design',
    difficulty: 'Easy',
    description:
      'Implement a FIFO queue using only stack operations (push, pop, peek, empty).',
    examples: [{ input: 'push(1), push(2), peek(), pop()', output: '1, then 2' }],
  }),
  problem({
    title: 'Smallest Missing Positive',
    category: 'Arrays & Hashmaps',
    difficulty: 'Hard',
    description:
      'Find the smallest positive integer that does not appear in the unsorted array. Use O(n) time and O(1) extra space.',
    examples: [{ input: 'values = [3, 4, -1, 1]', output: '2' }],
  }),
  problem({
    title: 'Max Product Subarray',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Find the contiguous subarray with the largest product of its elements.',
    examples: [{ input: 'values = [2, 3, -2, 4]', output: '6' }],
  }),
  problem({
    title: 'Asteroid Collision',
    category: 'Stacks',
    difficulty: 'Medium',
    description:
      'Asteroids move in a line; positive moves right, negative left. Same-size collisions destroy both. Return final state.',
    examples: [{ input: 'asteroids = [5, 10, -5]', output: '[5, 10]' }],
  }),
  problem({
    title: 'Clone Undirected Graph',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Deep-copy an undirected graph where each node has a value and neighbor list.',
    examples: [{ input: 'adjacency list graph', output: 'deep copy' }],
  }),
  problem({
    title: 'Pacific Atlantic Flow',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Heights on a grid flow to adjacent lower or equal cells. Return cells that can reach both Pacific and Atlantic oceans.',
    examples: [{ input: 'heights grid', output: 'list of coordinates' }],
  }),
  problem({
    title: 'Burst Balloon Max Coins',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    description:
      'Burst balloons labeled with nums[i]; coins equal product of neighbors. Maximize coins collected.',
    examples: [{ input: 'nums = [3, 1, 5, 8]', output: '167' }],
  }),
  problem({
    title: 'Wildcard Pattern Match',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    description:
      'Match string s to pattern p where ? matches any char and * matches any sequence (including empty).',
    examples: [{ input: 's = "adceb", p = "*a*b"', output: 'true' }],
  }),
  problem({
    title: 'Meeting Rooms Needed',
    category: 'Heaps',
    difficulty: 'Medium',
    description:
      'Given meeting intervals [start, end], return the minimum number of conference rooms required.',
    examples: [
      { input: 'intervals = [[0,30],[5,10],[15,20]]', output: '2' },
    ],
  }),
  problem({
    title: 'Ship Packages Capacity',
    category: 'Binary Search',
    difficulty: 'Medium',
    description:
      'Packages must ship within days days in order. Binary search the minimum ship capacity that works.',
    examples: [{ input: 'weights = [1,2,3,4,5,6,7,8,9,10], days = 5', output: '15' }],
  }),
  problem({
    title: 'Candy Distribution',
    category: 'Greedy',
    difficulty: 'Hard',
    description:
      'Children with ratings get candies; higher rating than neighbors means more candy. Minimize total candies.',
    examples: [{ input: 'ratings = [1, 0, 2]', output: '5' }],
  }),
  problem({
    title: 'Roman Numeral Parser',
    category: 'Strings',
    difficulty: 'Easy',
    description:
      'Convert a Roman numeral string to its integer value (standard subtractive notation).',
    examples: [{ input: 'symbol = "MCMXCIV"', output: '1994' }],
  }),
  problem({
    title: 'Power Function',
    category: 'Math',
    difficulty: 'Medium',
    description:
      'Compute x raised to the power n efficiently (handle negative exponents).',
    examples: [{ input: 'x = 2.0, n = 10', output: '1024.0' }],
  }),
  problem({
    title: 'Bit Range AND',
    category: 'Bit Manipulation',
    difficulty: 'Medium',
    description:
      'Return the bitwise AND of all numbers in the inclusive range [left, right].',
    examples: [{ input: 'left = 5, right = 7', output: '4' }],
  }),
  problem({
    title: 'Browser History Navigator',
    category: 'Design',
    difficulty: 'Medium',
    description:
      'Support visit(url), back(steps), and forward(steps) like a browser history stack.',
    examples: [{ input: 'visit(a), visit(b), back(1)', output: 'current = a' }],
  }),
  problem({
    title: 'Time Series Average',
    category: 'Design',
    difficulty: 'Easy',
    description:
      'Maintain a moving average of the last size values added to a stream.',
    examples: [{ input: 'size = 3, add(1), add(10), add(3), getAvg()', output: '4.666...' }],
  }),
  problem({
    title: 'Triple Sum Closest Target',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Find the triplet sum closest to target. Return that sum (assume exactly one closest triplet).',
    examples: [{ input: 'values = [-1,2,1,-4], target = 1', output: '2' }],
  }),
  problem({
    title: 'Next Lexicographic Permutation',
    category: 'Arrays & Hashmaps',
    difficulty: 'Medium',
    description:
      'Rearrange nums into the next lexicographically greater permutation in-place. If none exists, sort ascending.',
    examples: [{ input: 'values = [1, 2, 3]', output: '[1, 3, 2]' }],
  }),
  problem({
    title: 'Path Sum II All Routes',
    category: 'Trees & Graphs',
    difficulty: 'Medium',
    description:
      'Return all root-to-leaf paths where the sum of node values equals targetSum.',
    examples: [
      {
        input: 'root = [5,4,8,11,null,13,4,7,2,1], target = 22',
        output: '[[5,4,11],[5,8,4,7]]',
      },
    ],
  }),
  problem({
    title: 'Dungeon Minimum Health',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    description:
      'A dungeon grid has damage/healing cells. Find minimum initial health to reach bottom-right alive (health always positive).',
    examples: [{ input: 'dungeon grid', output: 'minimum starting HP' }],
  }),
  problem({
    title: 'Split Array Largest Sum',
    category: 'Binary Search',
    difficulty: 'Hard',
    description:
      'Split nums into m non-empty contiguous subarrays. Minimize the largest subarray sum among all splits.',
    examples: [{ input: 'nums = [7,2,5,10,8], m = 2', output: '18' }],
  }),
  problem({
    title: 'Hand of Straights',
    category: 'Greedy',
    difficulty: 'Medium',
    description:
      'Can hand be partitioned into groups of groupSize consecutive cards (each card used once)?',
    examples: [
      { input: 'hand = [1,2,3,6,2,3,4,7,8], groupSize = 3', output: 'true' },
    ],
  }),
  problem({
    title: 'Isomorphic String Map',
    category: 'Strings',
    difficulty: 'Easy',
    description:
      'Two strings are isomorphic if characters in s can be replaced to get t with a consistent one-to-one mapping.',
    examples: [{ input: 's = "egg", t = "add"', output: 'true' }],
  }),
  problem({
    title: 'Log File Reorder',
    category: 'Strings',
    difficulty: 'Medium',
    description:
      'Reorder logs so letter-logs come before digit-logs; letter-logs sorted by message then identifier.',
    examples: [{ input: 'log list', output: 'sorted logs' }],
  }),
  problem({
    title: 'Parking Lot Design',
    category: 'Design',
    difficulty: 'Easy',
    description:
      'Design a parking system with big, medium, and small slots. addCar returns whether a vehicle type can park.',
    examples: [{ input: 'big=1, med=1, small=0, addCar(small)', output: 'false' }],
  }),
  problem({
    title: 'Rate Limited Logger',
    category: 'Design',
    difficulty: 'Easy',
    description:
      'Logger should print a message at most once every 10 seconds per duplicate message text.',
    examples: [{ input: 'log("foo"), log("foo") within 10s', output: 'second suppressed' }],
  }),
]

export const catalog = allProblems.slice(0, 100)

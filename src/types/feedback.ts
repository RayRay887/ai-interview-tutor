import type { FeedbackRecommendation } from '../prompts/interviewer/feedbackRubric'
import type { Difficulty } from '../data/questions'

export interface RubricCriterionScore {
  id: string
  name: string
  score: number
  weight: number
  summary: string
}

export interface FeedbackSection {
  score: number
  criteria: RubricCriterionScore[]
  strengths: string[]
  improvements: string[]
}

export interface OptimizationSection extends FeedbackSection {
  timeComplexity: string
  spaceComplexity: string
  isOptimal: boolean
  optimizationSummary: string
}

export interface InterviewFeedbackResult {
  overallScore: number
  recommendation: FeedbackRecommendation
  headline: string
  code: FeedbackSection
  interview: FeedbackSection
  optimization: OptimizationSection
}

export interface InterviewFeedbackRequest {
  question: {
    title: string
    description: string
    difficulty: string
    category: string
    constraints?: string[]
  }
  code: {
    source: string
    language: string
  }
  tests: {
    passed: number
    total: number
    allPassed: boolean
    hiddenPassed?: number
    hiddenTotal?: number
    lastFailures?: string[]
  }
  transcript: { role: 'interviewer' | 'candidate' | 'hint'; text: string }[]
  session: {
    minutesTotal: number
    minutesUsed: number
    hintsUsed: number
  }
}

export interface FeedbackNavigationState {
  request: InterviewFeedbackRequest
  question: {
    slug: string
    title: string
    difficulty: Difficulty
    category: string
  }
}

export interface FeedbackViewState {
  feedback: InterviewFeedbackResult
  question: {
    slug: string
    title: string
    difficulty: Difficulty
    category: string
  }
}

import type { Question } from '../data/questions'

export type InterviewMessageRole = 'interviewer' | 'candidate' | 'hint'

export interface InterviewMessage {
  id: string
  role: InterviewMessageRole
  text: string
  createdAt: number
}

export interface InterviewQuestionContext {
  title: string
  description: string
  difficulty: string
  category: string
}

export function toInterviewQuestionContext(question: Question): InterviewQuestionContext {
  return {
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    category: question.category,
  }
}

export type InterviewPhase = 'idle' | 'starting' | 'ready' | 'thinking' | 'speaking' | 'error'

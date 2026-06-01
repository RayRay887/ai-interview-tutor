const INTERVIEWER_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey'] as const

export type InterviewerFirstName = (typeof INTERVIEWER_NAMES)[number]

export function pickInterviewerName(): InterviewerFirstName {
  const index = Math.floor(Math.random() * INTERVIEWER_NAMES.length)
  return INTERVIEWER_NAMES[index]
}

export function getSessionOpeningFallback(
  interviewerName: string,
  questionTitle: string,
): string {
  return `Hi, I'm ${interviewerName}. Thanks for joining Prepify today. We'll work on ${questionTitle} together. Take a moment to read through the problem on the left, and feel free to ask any clarifying questions before we dive in.`
}

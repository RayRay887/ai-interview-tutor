import {
  Bot,
  Code2,
  MessageSquare,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = [
  {
    icon: Bot,
    title: 'AI Interviewer',
    description:
      'Practice with an adaptive AI that asks follow-ups, probes your reasoning, and mirrors real FAANG-style interviews.',
  },
  {
    icon: Code2,
    title: 'Live Code Execution',
    description:
      'Write and run code in a full Monaco editor with instant test case validation against hidden and visible cases.',
  },
  {
    icon: MessageSquare,
    title: 'Communication Analysis',
    description:
      'Get scored on how clearly you explain trade-offs, complexity, and approach — not just whether your code passes.',
  },
  {
    icon: Zap,
    title: 'Real-Time Feedback',
    description:
      'Receive actionable hints, pacing alerts, and post-session reports while you still remember the problem.',
  },
]

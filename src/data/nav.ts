export interface NavLink {
  label: string
  href: string
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Examples', href: '/#samples' },
  { label: 'Live Demo', href: '/#demo' },
  { label: 'Question Bank', href: '/questions' },
]

import { Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-bg-secondary/50">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-8 sm:px-6 lg:px-8">
        <Sparkles className="h-4 w-4 text-accent-blue" />
        <p className="text-sm text-text-secondary">
          © {new Date().getFullYear()} Prepify. Practice smarter.
        </p>
      </div>
    </footer>
  )
}

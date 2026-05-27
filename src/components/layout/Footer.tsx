import { PrepifyLogo } from '../brand/PrepifyLogo'

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-bg-secondary/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <PrepifyLogo size="sm" linked={false} />
        <p className="text-sm text-text-secondary">
          © {new Date().getFullYear()} Prepify. Practice smarter.
        </p>
      </div>
    </footer>
  )
}

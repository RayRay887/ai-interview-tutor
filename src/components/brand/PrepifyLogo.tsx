import { Link } from 'react-router-dom'

const sizes = {
  sm: { box: 'h-7 w-7', icon: 16, text: 'text-base', gap: 'gap-2', radius: 'rounded-md' },
  md: { box: 'h-8 w-8', icon: 18, text: 'text-lg', gap: 'gap-2', radius: 'rounded-lg' },
  lg: { box: 'h-10 w-10', icon: 22, text: 'text-2xl', gap: 'gap-2.5', radius: 'rounded-xl' },
} as const

type LogoSize = keyof typeof sizes

interface PrepifyMarkProps {
  size?: number
  className?: string
}

/** Icon-only mark: P monogram + AI node */
export function PrepifyMark({ size = 20, className = '' }: PrepifyMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 5.5h5.2c2.9 0 5.3 2.4 5.3 5.3 0 2.6-1.9 4.8-4.4 5.1L17 20.5H13.5l-2.4-4.4H11v4.4H8V5.5Z"
        fill="currentColor"
      />
      <path
        d="M11 8.5h2.2c1.5 0 2.7 1.2 2.7 2.7s-1.2 2.7-2.7 2.7H11V8.5Z"
        fill="url(#prepify-mark-inner)"
        fillOpacity="0.35"
      />
      <circle cx="18.2" cy="6.8" r="2" fill="currentColor" fillOpacity="0.95" />
      <circle cx="18.2" cy="6.8" r="3.2" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <defs>
        <linearGradient id="prepify-mark-inner" x1="11" y1="8" x2="16" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface PrepifyLogoProps {
  size?: LogoSize
  showText?: boolean
  /** When false, renders without a link wrapper */
  linked?: boolean
  to?: string
  className?: string
}

export function PrepifyLogo({
  size = 'md',
  showText = true,
  linked = true,
  to = '/',
  className = '',
}: PrepifyLogoProps) {
  const s = sizes[size]

  const content = (
    <div className={`group flex items-center ${s.gap} ${className}`}>
      <div
        className={`relative flex ${s.box} shrink-0 items-center justify-center ${s.radius} bg-linear-to-br from-accent-blue via-[#5B8FFF] to-accent-purple text-white shadow-lg shadow-accent-blue/25 transition-shadow duration-300 group-hover:shadow-accent-blue/40`}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <PrepifyMark size={s.icon} />
      </div>
      {showText && (
        <span className={`${s.text} font-semibold tracking-tight`}>
          <span className="text-text-primary">Prep</span>
          <span className="bg-linear-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
            ify
          </span>
        </span>
      )}
    </div>
  )

  if (linked) {
    return (
      <Link
        to={to}
        className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
      >
        {content}
      </Link>
    )
  }

  return content
}

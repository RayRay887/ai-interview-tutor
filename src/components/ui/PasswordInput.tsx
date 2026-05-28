import { Lock } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

function EyeOpenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
        stroke="#4DA3FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="#4DA3FF" strokeWidth="2" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 3L21 21"
        stroke="#4DA3FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58C10.21 10.95 10 11.45 10 12C10 13.1 10.9 14 12 14C12.55 14 13.05 13.79 13.42 13.42"
        stroke="#4DA3FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.88 5.09C10.58 5.03 11.29 5 12 5C18.5 5 22 12 22 12C21.34 13.17 20.45 14.19 19.39 15.01M6.61 8.99C5.55 9.81 4.66 10.83 4 12C4 12 7.5 19 12 19C12.71 19 13.42 18.97 14.12 18.91"
        stroke="#4DA3FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PasswordInput({
  label = 'Password',
  className = '',
  id = 'password',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            {...props}
            id={id}
            type={visible ? 'text' : 'password'}
            className={`password-input w-full rounded-lg border border-white/10 bg-bg-primary/80 py-2.5 pr-4 pl-10 text-sm text-text-primary outline-none placeholder:text-text-secondary/50 focus:border-accent-blue/50 ${className}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-bg-secondary/80 transition-colors hover:border-accent-blue/40 hover:bg-accent-blue/10"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </button>
      </div>
    </div>
  )
}

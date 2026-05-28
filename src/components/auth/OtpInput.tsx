import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const DIGIT_COUNT = 6

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length: DIGIT_COUNT }, (_, index) => value[index] ?? '')

  const updateDigit = (index: number, digit: string) => {
    const next = value.split('')
    next[index] = digit
    onChange(next.join('').slice(0, DIGIT_COUNT))
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    updateDigit(index, digit)
    if (digit && index < DIGIT_COUNT - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT)
    if (!pasted) return
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, DIGIT_COUNT - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${DIGIT_COUNT}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="h-12 w-10 rounded-lg border border-white/10 bg-bg-primary/80 text-center text-lg font-semibold text-text-primary outline-none transition-colors focus:border-accent-blue/50 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  )
}

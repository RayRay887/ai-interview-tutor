import { ChevronDown } from 'lucide-react'
import { type ReactNode, useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  badge?: ReactNode
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  contentClassName?: string
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  action,
  defaultOpen = true,
  children,
  contentClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-white/10 bg-bg-secondary/40">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          />
          {icon}
          <span className="text-xs font-medium tracking-wider text-text-secondary uppercase">
            {title}
          </span>
          {badge}
        </button>
        {action}
      </div>

      {isOpen && <div className={contentClassName}>{children}</div>}
    </div>
  )
}

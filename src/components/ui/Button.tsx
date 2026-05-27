import { motion, type HTMLMotionProps } from 'framer-motion'
import { type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { scrollToTopIfSamePath } from '../../lib/scrollToTop'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: Variant
  href?: string
  to?: string
}

const variants: Record<Variant, string> = {
  primary:
    'bg-linear-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40',
  secondary:
    'glass text-text-primary hover:border-white/20 hover:bg-white/10',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  href,
  to,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 ${variants[variant]} ${className}`

  if (to) {
    const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (scrollToTopIfSamePath(to)) {
        e.preventDefault()
      }
    }

    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link to={to} className={classes} onClick={handleLinkClick}>
          {children}
        </Link>
      </motion.div>
    )
  }

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as HTMLMotionProps<'a'>)}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

import { type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { NavLink } from '../../data/nav'
import { scrollToHash } from '../../lib/scrollToHash'

interface NavLinkItemProps {
  link: NavLink
  className?: string
  onNavigate?: () => void
}

export function NavLinkItem({ link, className = '', onNavigate }: NavLinkItemProps) {
  const location = useLocation()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const hashIndex = link.href.indexOf('#')

    if (hashIndex === -1) {
      if (link.href === '/' && location.pathname === '/') {
        e.preventDefault()
        scrollToHash('')
      }
      onNavigate?.()
      return
    }

    const path = link.href.slice(0, hashIndex) || '/'
    const hash = link.href.slice(hashIndex)

    if (location.pathname === path) {
      e.preventDefault()
      scrollToHash(hash)
      onNavigate?.()
    }
  }

  return (
    <Link to={link.href} onClick={handleClick} className={className}>
      {link.label}
    </Link>
  )
}

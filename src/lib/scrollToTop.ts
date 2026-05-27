export function scrollToTop(behavior: ScrollBehavior = 'instant') {
  window.scrollTo({ top: 0, left: 0, behavior })
}

export function scrollToTopIfSamePath(targetPath: string) {
  const path = targetPath.split('#')[0] || '/'
  if (window.location.pathname === path) {
    scrollToTop('smooth')
    return true
  }
  return false
}

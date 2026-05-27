import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Features } from '../components/sections/Features'
import { Hero } from '../components/sections/Hero'
import { MockInterviewPreview } from '../components/sections/MockInterviewPreview'
import { SampleQuestions } from '../components/sections/SampleQuestions'
import { scrollToHash } from '../lib/scrollToHash'

export function HomePage() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => {
      scrollToHash(location.hash)
    }, 80)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  return (
    <main>
      <Hero />
      <Features />
      <SampleQuestions />
      <MockInterviewPreview />
    </main>
  )
}

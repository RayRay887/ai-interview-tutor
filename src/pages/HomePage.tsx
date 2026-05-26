import { Features } from '../components/sections/Features'
import { Hero } from '../components/sections/Hero'
import { MockInterviewPreview } from '../components/sections/MockInterviewPreview'
import { SampleQuestions } from '../components/sections/SampleQuestions'

export function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <SampleQuestions />
      <MockInterviewPreview />
    </main>
  )
}

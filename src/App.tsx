import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { PracticeLayout } from './components/layout/PracticeLayout'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { QuestionsPage } from './pages/QuestionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PracticeLayout />}>
          <Route path="/practice/:slug" element={<PracticePage />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

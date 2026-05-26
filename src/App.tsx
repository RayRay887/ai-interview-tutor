import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { QuestionsPage } from './pages/QuestionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/practice/:slug" element={<PracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AuthLayout } from './components/auth/AuthLayout'
import { Layout } from './components/layout/Layout'
import { PracticeLayout } from './components/layout/PracticeLayout'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { QuestionsPage } from './pages/QuestionsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/auth" element={<AuthPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<PracticeLayout />}>
              <Route path="/practice/:slug" element={<PracticePage />} />
            </Route>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/questions" element={<QuestionsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

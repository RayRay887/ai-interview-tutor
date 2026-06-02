import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { SignInModalProvider } from './context/SignInModalContext'
import { AuthLayout } from './components/auth/AuthLayout'
import { Layout } from './components/layout/Layout'
import { PracticeLayout } from './components/layout/PracticeLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { SessionFeedbackPage } from './pages/SessionFeedbackPage'
import { QuestionsPage } from './pages/QuestionsPage'

function AppShell() {
  return (
    <SignInModalProvider>
      <ScrollToTop />
      <Outlet />
    </SignInModalProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: 'auth', element: <AuthPage /> }],
      },
      {
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'questions', element: <QuestionsPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'feedback/attempt/:attemptId', element: <SessionFeedbackPage /> },
        ],
      },
      {
        path: 'practice/:slug',
        element: <PracticeLayout />,
        children: [{ index: true, element: <PracticePage /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App

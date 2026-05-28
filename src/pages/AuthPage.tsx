import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SignInForm } from '../components/auth/SignInForm'

export function AuthPage() {
  const navigate = useNavigate()
  const from = new URLSearchParams(window.location.search).get('from') ?? '/'

  return (
    <motion.div
      className="glass glow-blue relative w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SignInForm onSuccess={() => navigate(from, { replace: true })} />
    </motion.div>
  )
}

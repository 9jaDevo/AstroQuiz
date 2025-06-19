import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LandingPage from './components/LandingPage'
import AuthForm from './components/AuthForm'
import QuizGame from './components/QuizGame'
import Leaderboard from './components/Leaderboard'
import Profile from './components/Profile'
import AIChatbot from './components/AIChatbot'
import AdminPanel from './components/AdminPanel'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator, { OnlineIndicator } from './components/OfflineIndicator'
import { registerServiceWorker } from './utils/pwaUtils'

function App() {
  const { user, loading } = useAuth()

  // Register service worker on app start
  React.useEffect(() => {
    registerServiceWorker()
  }, [])

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading AstroQuiz...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineIndicator />
      <OnlineIndicator />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/quiz" replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to="/quiz" replace /> : <AuthForm />} />
        
        {/* Protected routes */}
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route path="quiz" element={<QuizGame />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="tutor" element={<AIChatbot />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/quiz" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
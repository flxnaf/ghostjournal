'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [isSignup, setIsSignup] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [clickCount, setClickCount] = useState(0)

  const { login, signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        await signup(email, password, name)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = () => {
    // Simple admin bypass - check for admin key
    if (adminKey === 'ghostadmin' || adminKey === 'admin123') {
      // Create a fake admin user session with valid UUID
      const adminUser = {
        id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for admin
        email: 'admin@replik.local',
        username: 'admin',
        name: 'Admin User',
        createdAt: new Date().toISOString()
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('adminBypass', 'true')
      localStorage.setItem('adminUser', JSON.stringify(adminUser))
      
      // Force reload to trigger auth state
      window.location.reload()
    } else {
      setError('Invalid admin key')
    }
  }

  const handleTitleClick = () => {
    setClickCount(prev => prev + 1)
    if (clickCount + 1 >= 5) {
      setShowAdminLogin(true)
      setClickCount(0)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleTitleClick}
          className="text-7xl font-bold mb-4 glow-text cursor-pointer select-none"
          title="Click 5 times for admin login"
        >
          Replik
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl text-gray-300 mb-12"
        >
          Create Your Digital Clone
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsSignup(true)
            setShowAuth(true)
          }}
          className="px-12 py-5 bg-white text-black font-bold text-lg rounded-lg
                   hover:bg-gray-200 transition-colors shadow-2xl mb-6"
        >
          Get Started
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400"
        >
          Already have an account?{' '}
          <button
            onClick={() => {
              setIsSignup(false)
              setShowAuth(true)
            }}
            className="text-white hover:underline"
          >
            Log in
          </button>
        </motion.p>
      </div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowAdminLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-card border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-3xl font-bold mb-2 text-center text-yellow-500">
                🔑 Admin Bypass
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                For development/testing only
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Key</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="w-full px-4 py-3 bg-dark-bg border border-yellow-500/30 rounded-lg
                             text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Enter admin key"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAdminLogin}
                  className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg
                           hover:bg-yellow-400 transition-colors"
                >
                  Login as Admin
                </button>

                <div className="text-xs text-gray-500 text-center mt-4">
                  Hint: Try "ghostadmin" or "admin123"
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-card border border-white/30 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-3xl font-bold mb-6 text-center">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Username *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                        className="w-full px-4 py-3 bg-dark-bg border border-white/20 rounded-lg
                                 text-white focus:border-white focus:outline-none"
                        placeholder="username_123"
                        pattern="[a-z0-9_]+"
                        title="Only lowercase letters, numbers, and underscores"
                        minLength={3}
                        maxLength={20}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        3-20 characters: lowercase, numbers, underscores only
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-dark-bg border border-white/20 rounded-lg
                                 text-white focus:border-white focus:outline-none"
                        placeholder="your@email.com"
                      />
                    </div>
                  </>
                )}

                {!isSignup && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-white/20 rounded-lg
                               text-white focus:border-white focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-dark-bg border border-white/20 rounded-lg
                             text-white focus:border-white focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg
                           hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(!isSignup)
                    setError('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


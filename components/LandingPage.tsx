'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [isSignup, setIsSignup] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [clickCount, setClickCount] = useState(0)

  const { login, signup, loginWithGoogle } = useAuth()

  // Password validation
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' }
    if (pwd.length < 8) return { strength: 1, label: 'Too short', color: 'text-red-400' }
    
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    
    if (strength <= 2) return { strength: 2, label: 'Weak', color: 'text-orange-400' }
    if (strength <= 3) return { strength: 3, label: 'Good', color: 'text-yellow-400' }
    return { strength: 4, label: 'Strong', color: 'text-green-400' }
  }

  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const isFormValid = isSignup 
    ? email && password.length >= 8 && passwordsMatch && name
    : email && password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend validation
    if (isSignup) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (!name.trim()) {
        setError('Username is required')
        return
      }
    }

    setLoading(true)

    try {
      if (isSignup) {
        await signup(email, password, name)
        // If we reach here and no redirect happened, signup succeeded
        // (email confirmation is disabled)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setLoading(false)
    }
    // Don't set loading(false) here if signup redirects
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
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
                  <label className="block text-sm font-medium mb-2">
                    Password {isSignup && '*'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-11 pr-11 py-3 bg-dark-bg border border-white/20 rounded-lg
                               text-white focus:border-white focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isSignup && password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded ${
                              passwordStrength.strength >= level
                                ? level === 1 ? 'bg-red-400'
                                : level === 2 ? 'bg-orange-400'
                                : level === 3 ? 'bg-yellow-400'
                                : 'bg-green-400'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                  
                  {isSignup && (
                    <p className="text-xs text-gray-500 mt-1">
                      Min. 8 characters, mix of letters, numbers & symbols
                    </p>
                  )}
                </div>

                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className={`w-full pl-11 pr-11 py-3 bg-dark-bg rounded-lg text-white focus:outline-none border ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-green-500'
                              : 'border-red-500'
                            : 'border-white/20 focus:border-white'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${
                        passwordsMatch ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {passwordsMatch ? (
                          <><CheckCircle className="w-3 h-3" /> Passwords match</>
                        ) : (
                          <><AlertCircle className="w-3 h-3" /> Passwords do not match</>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (isSignup && !isFormValid)}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg
                           hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Log In')}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-card text-gray-400">or</span>
                </div>
              </div>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignup(!isSignup)
                    setError('')
                    setConfirmPassword('')
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


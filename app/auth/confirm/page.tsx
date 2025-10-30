'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, XCircle } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting')

  useEffect(() => {
    // Check if user just signed up (from URL params)
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    
    if (email) {
      setStatus('waiting')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-dark-surface/50 backdrop-blur-xl border border-dark-border rounded-2xl p-8 text-center">
          {status === 'waiting' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-6"
              >
                <div className="w-20 h-20 rounded-full bg-neon-blue/10 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-neon-blue" />
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Check your email
              </h1>
              
              <p className="text-gray-300 mb-6">
                We've sent you a confirmation link. Click the link in your email to activate your account and start creating your digital twin.
              </p>

              <div className="bg-dark-bg/50 border border-dark-border rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-2">
                  ✉️ Didn't receive the email?
                </p>
                <ul className="text-xs text-gray-500 space-y-1 text-left">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Wait a few minutes and refresh</li>
                </ul>
              </div>

              <a
                href="/"
                className="text-neon-blue hover:text-neon-cyan transition-colors text-sm"
              >
                ← Back to home
              </a>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 mx-auto">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Email confirmed!
              </h1>
              
              <p className="text-gray-300 mb-6">
                Your account is now active. Redirecting...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Confirmation failed
              </h1>
              
              <p className="text-gray-300 mb-6">
                Something went wrong. Please try signing up again or contact support.
              </p>

              <a
                href="/"
                className="text-neon-blue hover:text-neon-cyan transition-colors text-sm"
              >
                ← Back to home
              </a>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}


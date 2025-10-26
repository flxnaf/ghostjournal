'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

interface EmailConfirmationProps {
  email: string
  onBack: () => void
}

export default function EmailConfirmation({ email, onBack }: EmailConfirmationProps) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleResend = async () => {
    setResending(true)
    setError('')
    setResent(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        throw error
      }

      setResent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md bg-dark-lighter p-8 rounded-lg border border-white/10"
      >
        {/* Email icon */}
        <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center bg-white/10 rounded-full">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-4">Check your email</h1>

        <p className="text-white/70 mb-2">
          We sent a verification link to:
        </p>

        <p className="text-white font-medium mb-6">
          {email}
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-sm text-white/60 mb-2">
            📬 Click the link in the email to verify your account
          </p>
          <p className="text-sm text-white/60">
            After verification, you'll be asked to provide consent for data usage
          </p>
        </div>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-colors mb-4"
        >
          {resending ? 'Sending...' : resent ? '✓ Email sent!' : 'Resend verification email'}
        </button>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {/* Back button */}
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Back to login
        </button>

        {/* Help text */}
        <p className="text-xs text-white/40 mt-8">
          Can't find the email? Check your spam folder
        </p>
      </motion.div>
    </div>
  )
}

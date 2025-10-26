'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Recorder from '@/components/Recorder'
import Uploader from '@/components/Uploader'
import CloneTabs from '@/components/CloneTabs'
import LandingPage from '@/components/LandingPage'
import ConsentDialog from '@/components/ConsentDialog'
import { EnvErrorMessage } from '@/components/EnvErrorMessage'
import { useAuth } from '@/lib/hooks/useAuth'
import axios from 'axios'

export default function Home() {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  const isSupabaseMissing = !supabaseUrl || !supabaseKey || 
    supabaseUrl === 'https://placeholder.supabase.co' || 
    supabaseKey === 'placeholder-key'
  
  // Show error message if environment variables are not configured
  if (isSupabaseMissing) {
    return <EnvErrorMessage />
  }
  
  const { user, isLoading, logout } = useAuth()
  
  // Show landing page if not logged in
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }
  
  if (!user) {
    return <LandingPage />
  }
  
  // Main app for logged-in users
  return <AuthenticatedApp user={user} logout={logout} />
}

function AuthenticatedApp({ user, logout }: { user: any, logout: () => void }) {
  const [showConsent, setShowConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [step, setStep] = useState<'record' | 'upload' | 'chat'>('record')
  const [userId, setUserId] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [voiceTraining, setVoiceTraining] = useState({
    isTraining: false,
    progress: 0,
    status: 'Not started'
  })

  // Check if user has already given consent
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const response = await axios.get(`/api/user-consent?userId=${user.id}`)
        if (response.data.hasConsent) {
          setConsentGiven(true)
        } else {
          setShowConsent(true)
        }
      } catch (error) {
        // If error, show consent dialog to be safe
        setShowConsent(true)
      }
    }
    checkConsent()
  }, [user.id])

  const handleConsentAccept = async (consent: {
    audio: boolean
    chat: boolean
    context: boolean
    faceData: boolean
  }) => {
    try {
      await axios.post('/api/save-consent', {
        userId: user.id,
        ...consent
      })
      setConsentGiven(true)
      setShowConsent(false)
    } catch (error) {
      console.error('Failed to save consent:', error)
      alert('Failed to save consent. Please try again.')
    }
  }

  const handleConsentDecline = () => {
    alert('You must accept data storage to use GhostJournal. You can customize what data to save.')
  }

  const handleRecordingComplete = async (blob: Blob) => {
    console.log('🎤 Recording complete! Blob size:', blob.size, 'bytes')
    setAudioBlob(blob)
    
    // Move to upload page IMMEDIATELY (don't wait for training)
    console.log('➡️ Moving to upload step...')
    setStep('upload')
    
    // Start voice training in background
    console.log('🎤 Recording complete, starting voice training...')
    setVoiceTraining({ isTraining: true, progress: 10, status: 'Uploading audio...' })
    
    try {
      // Create user with audio only
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      
      const response = await axios.post('/api/create-user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setVoiceTraining({ 
            isTraining: true, 
            progress: Math.min(percentCompleted / 2, 50), // 0-50% for upload
            status: 'Uploading audio...'
          })
        }
      })
      
      const newUserId = response.data.userId
      console.log('✅ User created! Setting userId:', newUserId)
      setUserId(newUserId)
      
      // Start voice training
      setVoiceTraining({ isTraining: true, progress: 50, status: 'Training voice model (S1)...' })
      
      const voiceResponse = await axios.post('/api/voice-clone', { userId: newUserId })
      
      setVoiceTraining({ isTraining: true, progress: 100, status: 'Voice model ready!' })
      
      console.log('✅ Voice training complete:', voiceResponse.data.modelId)
      
    } catch (error) {
      console.error('❌ Voice training failed:', error)
      setVoiceTraining({ isTraining: false, progress: 0, status: 'Training failed - using default voice' })
    }
  }

  const handleUploadComplete = (id: string) => {
    setUserId(id)
    setStep('chat')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Consent Dialog */}
      <ConsentDialog
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      {/* Block UI until consent is given */}
      {!consentGiven && !showConsent && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Main app - only show after consent */}
      {consentGiven && (
        <>
          {/* User Info & Logout */}
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="text-white font-medium">{user.name || user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-transparent border border-white/30 text-white text-sm rounded-lg
                       hover:bg-white hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-bold mb-4 glow-text">
          GhostJournal
        </h1>
                <p className="text-white text-xl">
                  Your AI Clone
                </p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex gap-4 mb-8">
        {['record', 'upload', 'chat'].map((s, idx) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-all ${
              step === s
                ? 'bg-white w-8 border border-white'
                : 'bg-dark-border'
            }`}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl"
      >
        {step === 'record' && (
          <Recorder onComplete={handleRecordingComplete} />
        )}
        {step === 'upload' && audioBlob && (
          <>
            {console.log('🔍 Render check - step:', step, 'audioBlob:', !!audioBlob, 'userId:', userId || 'NOT SET YET')}
            {userId ? (
              <Uploader
                audioBlob={audioBlob}
                userId={userId}
                voiceTraining={voiceTraining}
                onComplete={handleUploadComplete}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-dark-surface rounded-lg glow-border">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
                <p className="text-white text-xl">Creating your profile...</p>
                <p className="text-gray-400 text-sm mt-2">Voice model is being set up</p>
              </div>
            )}
          </>
        )}
        {step === 'chat' && userId && (
          <CloneTabs userId={userId} />
        )}
      </motion.div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
        </>
      )}
    </main>
  )
}


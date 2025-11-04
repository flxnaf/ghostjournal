'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon } from 'lucide-react'
import Recorder from '@/components/Recorder'
import Uploader from '@/components/Uploader'
import CloneTabs from '@/components/CloneTabs'
import Dashboard from '@/components/Dashboard'
import Settings from '@/components/Settings'
import CloneBrowser from '@/components/CloneBrowser'
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

function AuthenticatedApp({ user: initialUser, logout }: { user: any, logout: () => void }) {
  const [user, setUser] = useState(initialUser)
  const [showConsent, setShowConsent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [view, setView] = useState<'dashboard' | 'character' | 'browse'>('dashboard')
  const [step, setStep] = useState<'record' | 'upload' | 'chat'>('record')
  const [userId, setUserId] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [browsingUserId, setBrowsingUserId] = useState<string | null>(null)
  const [browsingUserName, setBrowsingUserName] = useState<string | null>(null)
  const [userIsPublic, setUserIsPublic] = useState(user.isPublic || false)
  const [voiceTraining, setVoiceTraining] = useState({
    isTraining: false,
    progress: 0,
    status: 'Not started',
    error: null as string | null
  })

  // Refresh user's isPublic status when returning to dashboard
  useEffect(() => {
    if (view === 'dashboard') {
      console.log('🔄 Refreshing user data for dashboard...')
      console.log('   Current user.isPublic:', user.isPublic)
      axios.get(`/api/personality?userId=${user.id}`)
        .then(res => {
          console.log('📦 Fresh user data received:')
          console.log('   isPublic:', res.data.isPublic)
          console.log('   voiceModelId:', !!res.data.voiceModelId)
          console.log('   faceData:', !!res.data.faceData)
          console.log('   photoUrls:', !!res.data.photoUrls)
          
          // Update both local state AND user object
          setUserIsPublic(res.data.isPublic || false)
          user.isPublic = res.data.isPublic || false
          user.voiceModelId = res.data.voiceModelId
          user.faceData = res.data.faceData
          user.photoUrls = res.data.photoUrls
          
          console.log('✅ User object updated')
        })
        .catch(err => {
          console.error('❌ Failed to refresh user status:', err)
          console.error('   Error response:', err.response?.data)
        })
    }
  }, [view, user.id])

  // Check if user has already given consent and if they have audio
  useEffect(() => {
    const checkConsentAndData = async () => {
      console.log('🔍 Checking consent for user:', user.id)
      try {
        const response = await axios.get(`/api/user-consent?userId=${user.id}`)
        console.log('✅ Consent check response:', response.data)
        if (response.data.hasConsent) {
          console.log('✅ User has consent, setting consentGiven=true')
          setConsentGiven(true)
          
          // Check if user already has audio and skip recording
          try {
            const userDataResponse = await axios.get(`/api/personality?userId=${user.id}`)
            const userData = userDataResponse.data
            
            if (userData.audioUrl) {
              console.log('✅ User already has audio, skipping to chat')
              setUserId(user.id)
              setStep('chat')
            } else {
              console.log('⚠️ User has no audio, staying on record step')
            }
          } catch (err) {
            console.log('⚠️ Could not fetch user data, staying on record step')
          }
        } else {
          console.log('⚠️ User has no consent, showing consent dialog')
          setShowConsent(true)
        }
      } catch (error: any) {
        console.error('❌ Consent check error:', error)
        console.error('   Error response:', error.response?.data)
        // If error, show consent dialog to be safe
        console.log('⚠️ Showing consent dialog due to error')
        setShowConsent(true)
      }
    }
    checkConsentAndData()
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
    setVoiceTraining({ isTraining: true, progress: 10, status: 'Uploading audio...', error: null })
    
    try {
      // Create user with audio only
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      
      const response = await axios.post('/api/create-user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setVoiceTraining({ 
            isTraining: true, 
            progress: Math.min(percentCompleted / 2, 50), // 0-50% for upload
            status: 'Uploading audio...',
            error: null
          })
        }
      })
      
      const newUserId = response.data.userId
      console.log('✅ User created! Setting userId:', newUserId)
      setUserId(newUserId)
      
      // Start voice training
      setVoiceTraining({ isTraining: true, progress: 50, status: 'Training voice model (S1)...', error: null })
      
      const voiceResponse = await axios.post('/api/voice-clone', { 
        userId: newUserId 
      }, {
        timeout: 200000 // 200 second timeout (generous for Fish Audio training)
      })
      
      setVoiceTraining({ isTraining: true, progress: 100, status: 'Voice model ready!', error: null })
      
      console.log('✅ Voice training complete:', voiceResponse.data.modelId)
      
    } catch (error: any) {
      console.error('❌ Voice training failed:', error)
      console.error('   Error response:', error.response)
      console.error('   Error data:', error.response?.data)
      
      // Determine which step failed
      const step = error.config?.url?.includes('create-user') ? 'User Creation' :
                   error.config?.url?.includes('voice-clone') ? 'Voice Training' : 'Unknown'
      
      const errorMessage = error.response?.data?.details || 
                          error.response?.data?.error ||
                          error.message || 
                          'Unknown error'
      
      setVoiceTraining({ 
        isTraining: false, 
        progress: 0, 
        status: 'Training failed - using default voice',
        error: `${step}: ${errorMessage}`
      })
      
      // IMPORTANT: Still allow user to continue even if voice training failed
      // Set a temporary userId so they can proceed to the upload step
      if (!userId) {
        console.log('⚠️ Setting userId to user.id to allow continuation')
        setUserId(user.id)
      }
    }
  }

  const handleUploadComplete = (id: string) => {
    setUserId(id)
    setStep('chat')
  }

  const handleReRecord = () => {
    setStep('record')
    setAudioBlob(null)
    setUserId(null)
    setVoiceTraining({
      isTraining: false,
      progress: 0,
      status: 'Not started',
      error: null
    })
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-transparent border border-white/30 text-white text-sm rounded-lg
                     hover:bg-white hover:text-black transition-colors"
          >
            Logout
          </button>
        </div>
      )}

      {/* Main app - only show after consent */}
      {consentGiven && (
        <>
          {/* User Info & Settings & Logout */}
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="text-white font-medium">@{user.username || user.name || user.email}</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all group"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
            </button>
            {browsingUserId && (
              <button
                onClick={() => {
                  setView('browse')
                  setBrowsingUserId(null)
                  setBrowsingUserName(null)
                }}
                className="px-4 py-2 bg-transparent border border-white/30 text-white text-sm rounded-lg
                         hover:bg-white/20 transition-colors"
              >
                ← Back to Browse
              </button>
            )}
            {view !== 'dashboard' && !browsingUserId && (
              <button
                onClick={() => {
                  setView('dashboard')
                  setBrowsingUserId(null)
                  setBrowsingUserName(null)
                }}
                className="px-4 py-2 bg-transparent border border-white/30 text-white text-sm rounded-lg
                         hover:bg-white/20 transition-colors"
              >
                ← Dashboard
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-transparent border border-white/30 text-white text-sm rounded-lg
                       hover:bg-white hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>

      {/* Main Content Based on View */}
      {view === 'dashboard' && (
        <Dashboard
          user={user}
          onCreateCharacter={async () => {
            console.log('═══════════════════════════════════════════')
            console.log('🎯 EDIT CHARACTER CLICKED')
            console.log('═══════════════════════════════════════════')
            console.log('   User ID:', user.id)
            console.log('   User object audioUrl:', user.audioUrl ? 'EXISTS' : 'NULL')
            console.log('   User object faceData:', user.faceData ? 'EXISTS' : 'NULL')
            
            // Check user's completion status
            try {
              console.log('🔍 Fetching fresh user data from /api/personality...')
              const userDataResponse = await axios.get(`/api/personality?userId=${user.id}`)
              const userData = userDataResponse.data
              
              console.log('📦 RECEIVED DATA FROM API:')
              console.log('   audioUrl:', userData.audioUrl || 'NULL')
              console.log('   voiceModelId:', userData.voiceModelId || 'NULL')
              console.log('   faceData:', userData.faceData ? `${userData.faceData.substring(0, 50)}...` : 'NULL')
              console.log('   photoUrls:', userData.photoUrls || 'NULL')
              
              // FIX: Check voiceModelId instead of audioUrl
              // voiceModelId is what matters - it's the trained Fish Audio model
              const hasVoice = !!userData.voiceModelId
              const hasFaceData = !!userData.faceData
              const hasCompletedSetup = hasVoice && hasFaceData
              
              console.log('📊 SETUP STATUS EVALUATION:')
              console.log('   hasVoice (voiceModelId):', hasVoice)
              console.log('   hasFaceData:', hasFaceData)
              console.log('   hasCompletedSetup:', hasCompletedSetup)
              
              if (hasCompletedSetup) {
                console.log('✅✅✅ SETUP COMPLETE - GOING TO CLONETABS')
                setUserId(user.id)
                setStep('chat')
              } else if (hasVoice && !hasFaceData) {
                console.log('⚠️ PARTIAL SETUP - Voice done, photo/context missing')
                console.log('   Going to upload step...')
                setAudioBlob(new Blob())
                setUserId(user.id)
                setVoiceTraining({
                  isTraining: false,
                  progress: 100,
                  status: 'Completed',
                  error: null
                })
                setStep('upload')
              } else {
                console.log('❌ NO SETUP - Starting from voice recording')
                console.log('   Reason: hasVoice =', hasVoice, ', hasFaceData =', hasFaceData)
                setStep('record')
              }
            } catch (err: any) {
              console.error('❌❌❌ ERROR CHECKING SETUP STATUS')
              console.error('   Error:', err)
              console.error('   Response:', err.response?.data)
              console.error('   Status:', err.response?.status)
              console.log('⚠️ DEFAULTING TO RECORD STEP DUE TO ERROR')
              setStep('record')
            }
            
            console.log('🎬 Setting view to character...')
            console.log('   Final step will be:', step)
            console.log('═══════════════════════════════════════════')
            setView('character')
          }}
          onBrowseClones={() => setView('browse')}
          onLogout={logout}
          onReRecordVoice={() => {
            setView('character')
            handleReRecord()
          }}
          onUserUpdate={(updatedUser) => {
            // Update the user state to trigger re-render
            setUser(updatedUser)
            console.log('✅ User updated:', updatedUser)
          }}
        />
      )}

      {view === 'browse' && (
        <CloneBrowser
          currentUserId={user.id}
          onSelectClone={async (selectedUserId) => {
            setBrowsingUserId(selectedUserId)
            setUserId(selectedUserId)
            setStep('chat')
            setView('character')
            
            // Fetch the browsing user's name
            try {
              const response = await axios.get(`/api/personality?userId=${selectedUserId}`)
              const userName = response.data.name || response.data.username || 'User'
              setBrowsingUserName(userName)
            } catch (error) {
              console.error('Failed to fetch browsing user name:', error)
              setBrowsingUserName('User')
            }
          }}
        />
      )}

      {view === 'character' && (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl font-bold mb-4 glow-text">
              {browsingUserId && browsingUserId !== user.id ? `${browsingUserName || 'User'}'s Clone` : 'Replik'}
            </h1>
            <p className="text-white text-xl">
              {browsingUserId && browsingUserId !== user.id ? `Talking to ${browsingUserName || "another user"}'s clone` : 'Your Digital Clone'}
            </p>
          </motion.div>

          {/* Step Indicator (only for own character) */}
          {(!browsingUserId || browsingUserId === user.id) && step !== 'chat' && (
            <div className="flex gap-4 mb-8 justify-center">
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
          )}

          {/* Main Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl"
          >
            {step === 'record' && (!browsingUserId || browsingUserId === user.id) && (
              <Recorder onComplete={handleRecordingComplete} />
            )}
            {step === 'upload' && audioBlob && (!browsingUserId || browsingUserId === user.id) && (
              <>
                {console.log('🔍 Render check - step:', step, 'audioBlob:', !!audioBlob, 'userId:', userId || 'NOT SET YET')}
                {userId ? (
                  <Uploader
                    audioBlob={audioBlob}
                    userId={userId}
                    voiceTraining={voiceTraining}
                    onComplete={handleUploadComplete}
                    onReRecord={handleReRecord}
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
              <CloneTabs 
                userId={browsingUserId || userId} 
                currentUserId={user.id}
                isOwner={!browsingUserId || browsingUserId === user.id}
                ownerName={browsingUserId ? browsingUserName : null}
                username={browsingUserId ? browsingUserName : (user.username || user.name)}
              />
            )}
          </motion.div>
        </>
      )}

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          user={user}
          onClose={() => setShowSettings(false)}
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser)
            console.log('✅ User updated from settings:', updatedUser)
          }}
          onLogout={logout}
        />
      )}
        </>
      )}
    </main>
  )
}


'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { StopCircle, Edit3, Volume2, Music } from 'lucide-react'

const FaceWaveform3D = dynamic(() => import('./FaceWaveform3D'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-white">Loading face visualization...</div>
})

interface Message {
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string
}

interface CloneChatProps {
  userId: string
  ownerName?: string | null // Name of the clone owner (if browsing another user's clone)
}

export default function CloneChat({ userId, ownerName }: CloneChatProps) {
  console.log('🎭 CloneChat initialized:')
  console.log('   userId:', userId)
  console.log('   ownerName:', ownerName)
  console.log('   Is browsing another user:', !!ownerName)
  
  // Generate initial message based on ownerName
  const getInitialMessage = () => {
    return ownerName 
      ? `Hey! I'm ${ownerName}'s clone. Talk to me like you're talking to ${ownerName}- I'll respond exactly how they would.`
      : "Hey! I'm your clone. Talk to me like you're talking to yourself - I'll respond exactly how YOU would."
  }
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: getInitialMessage()
    }
  ])
  
  // Track previous ownerName to detect actual changes
  const [prevOwnerName, setPrevOwnerName] = useState(ownerName)
  
  // Only reset messages if ownerName actually changes (not just tab switch)
  useEffect(() => {
    if (ownerName !== prevOwnerName) {
      console.log('🔄 ownerName changed from', prevOwnerName, 'to', ownerName, '- resetting messages')
      setMessages([
        {
          role: 'assistant',
          content: getInitialMessage()
        }
      ])
      setPrevOwnerName(ownerName)
    }
  }, [ownerName, prevOwnerName])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral')
  const [canInterrupt, setCanInterrupt] = useState(true)
  const [critiquingIdx, setCritiquingIdx] = useState<number | null>(null)
  const [critiqueInput, setCritiqueInput] = useState('')
  
  // Store userId in sessionStorage for FaceWaveform3D
  useEffect(() => {
    if (userId) {
      sessionStorage.setItem('userId', userId)
    }
  }, [userId])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [showAudioPrompt, setShowAudioPrompt] = useState(true)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Store userId in sessionStorage for FaceWaveform3D to access
  useEffect(() => {
    sessionStorage.setItem('userId', userId)
  }, [userId])

  // Initialize audio context on mount
  const enableAudio = async () => {
    try {
      console.log('🔊 Enabling audio...')
      
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      
      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      console.log('✅ AudioContext ready, state:', audioContext.state)
      
      // Play a silent test sound to "unlock" audio
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0 // Silent
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(0)
      oscillator.stop(0.001)
      
      console.log('✅ Audio system unlocked and ready!')
      setAudioEnabled(true)
      setShowAudioPrompt(false)
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.textContent = '✅ Audio Enabled!'
      successMsg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:15px 30px;background:#00ff88;color:#000;border-radius:10px;font-weight:bold;z-index:9999;'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 2000)
      
    } catch (error) {
      console.error('❌ Failed to enable audio:', error)
      alert('Failed to enable audio. Please check your browser settings.')
    }
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    // Anger/frustration - check for negative tone
    if (lowerText.match(/\b(hate|annoying|piss|irritat|frustrat|stupid|idiot|damn|hell|screw|fuck|angry|mad|rage|furious)\b/)) return 'anger'
    
    // Disgust
    if (lowerText.match(/\b(gross|disgusting|eww|yuck|nasty|revolting|sick|vomit|gag)\b/)) return 'disgust'
    
    // Surprise/shock
    if (lowerText.match(/\b(wow|whoa|oh my|omg|what|shocked|surprised|unbelievable|incredible|no way)\b/)) return 'surprise'
    
    // Love/affection
    if (lowerText.match(/\b(love|adore|cherish|treasure|heart|sweetheart|darling|dear)\b/)) return 'love'
    
    // Strong positive emotions (joy)
    if (lowerText.match(/\b(happy|joy|awesome|amazing|great|excited|thrilled|perfect|fantastic|wonderful)\b/)) return 'joy'
    
    // Sadness (check early before joy/love can catch "sorry")
    if (lowerText.match(/\b(sad|sadness|depressed|depression|down|blue|disappointed|disappointment|sorry|unfortunate|miserable|heartbroken|unhappy|gloomy|melancholy|grief|sorrow|crying|cry|tears|weep)\b/)) return 'sadness'
    
    // Fear
    if (lowerText.match(/\b(scared|afraid|frightened|terrified|fear|panic|horror)\b/)) return 'fear'
    
    // Concern/worry
    if (lowerText.match(/\b(worried|concerned|anxious|nervous|careful|cautious|uneasy)\b/)) return 'concern'
    
    // Calm/neutral
    if (lowerText.match(/\b(calm|collected|cool|relax|chill|shrug|no big deal|whatever|fine|okay)\b/)) return 'neutral'
    
    return 'neutral'
  }

  const analyzeAudio = (forceStart: boolean = false) => {
    const shouldContinue = forceStart || isPlaying
    
    if (!analyserRef.current) {
      // No analyzer - generate fake waveform data for visualization
      if (shouldContinue) {
        const fakeData = Array.from({ length: 128 }, () => 
          Math.random() * 0.6 + (Math.sin(Date.now() / 100) * 0.3 + 0.3)  // Higher values for more visible effect
        )
        setAudioData(fakeData)
        const avg = (fakeData.reduce((a,b) => a+b, 0) / fakeData.length)
        console.log(`%c🎵 Generating FAKE waveform:`, 'color: magenta; font-weight: bold', 
          `${fakeData.length} samples, avg=${avg.toFixed(3)}`)
        animationFrameRef.current = requestAnimationFrame(() => analyzeAudio())
      }
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Normalize to 0-1 range
    const normalized = Array.from(dataArray).map(val => val / 255)
    setAudioData(normalized)

    if (shouldContinue) {
      animationFrameRef.current = requestAnimationFrame(() => analyzeAudio())
    }
  }

  const playAudio = async (audioUrl: string) => {
    try {
      console.log('🎵 Attempting to play audio:', audioUrl)
      
      // Stop any currently playing audio
      if (audioRef.current) {
        console.log('⏹️ Stopping previous audio')
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
      
      // Create NEW audio element for each playback
      const audio = new Audio(audioUrl)
      audio.crossOrigin = 'anonymous' // Allow CORS for local files
      audioRef.current = audio
      
      // Add error handling
      audio.onerror = (e) => {
        console.error('❌ Audio loading error:', e)
        console.error('   Audio URL:', audioUrl)
        console.error('   Audio error code:', audio.error?.code)
        console.error('   Audio error message:', audio.error?.message)
        setIsPlaying(false)
      }
      
      audio.onloadeddata = () => {
        console.log('✅ Audio data loaded successfully')
        console.log('   Duration:', audio.duration, 'seconds')
      }

      // Set volume to MAXIMUM to ensure it's audible
      audio.volume = 1.0
      audio.muted = false
      console.log('🔊 Audio volume set to:', audio.volume, 'muted:', audio.muted)

      // Initialize and resume audio context first (for permission)
      if (!audioContextRef.current) {
        console.log('🎛️ Creating new AudioContext')
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        } catch (e: any) {
          console.error('❌ Could not create AudioContext:', e.message)
        }
      }
      
      if (audioContextRef.current) {
        const audioContext = audioContextRef.current
        console.log('🎛️ AudioContext state:', audioContext.state)
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          console.log('🔓 Resuming suspended audio context...')
          try {
            await audioContext.resume()
            console.log('✅ AudioContext resumed, state:', audioContext.state)
          } catch (e: any) {
            console.error('❌ Could not resume AudioContext:', e.message)
          }
        }
      }

      // For now, DON'T use Web Audio API - just play directly
      // This ensures audio actually plays through default output
      console.log('🎵 Using direct audio playback (no Web Audio API)')
      console.log('   Audio will play through default output')

      audio.onplay = () => {
        console.log('▶️ Audio PLAYING event fired')
        setIsPlaying(true)
        setCanInterrupt(false) // Disable input while playing
        // Force start the waveform animation (bypass async state)
        analyzeAudio(true)
      }

      audio.onended = () => {
        console.log('⏹️ Audio ENDED event fired')
        setIsPlaying(false)
        setAudioData([])
        setCurrentEmotion('neutral') // Reset to white when audio stops
        setCanInterrupt(true) // Re-enable input
        // Stop the animation loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = undefined
        }
      }
      
      audio.onpause = () => {
        console.log('⏸️ Audio PAUSED event fired')
        setIsPlaying(false)
        setCurrentEmotion('neutral') // Reset to white when audio pauses
        setCanInterrupt(true) // Re-enable input
        // Stop the animation loop
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = undefined
        }
      }

      console.log('🎬 Calling audio.play()...')
      console.log('   Audio ready state:', audio.readyState)
      console.log('   Audio network state:', audio.networkState)
      console.log('   Audio muted:', audio.muted)
      console.log('   Audio volume:', audio.volume)
      console.log('   Audio src:', audio.src)
      
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        await playPromise
          .then(() => {
            console.log('✅✅✅ Audio playback started successfully!')
          })
          .catch(async (error) => {
            console.error('❌ Audio playback BLOCKED:', error.name)
            console.error('   Error message:', error.message)
            
            if (error.name === 'NotAllowedError') {
              console.error('   🚫 Browser autoplay policy blocked audio')
              console.error('   💡 Solution: User must interact with page first')
              
              // For hackathon demo: show a visual indicator instead of alert
              const playBtn = document.createElement('button')
              playBtn.textContent = '🔊 Click to Play Audio'
              playBtn.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px 40px;font-size:20px;background:#ffffff;color:#000;border:none;border-radius:10px;cursor:pointer;z-index:9999;animation:pulse 1s infinite;'
              document.body.appendChild(playBtn)
              
              playBtn.onclick = async () => {
                if (audioContextRef.current) {
                  await audioContextRef.current.resume()
                }
                await audio.play()
                document.body.removeChild(playBtn)
              }
            } else {
              console.error('   Unknown audio error:', error)
            }
          })
      }
    } catch (error: any) {
      console.error('❌❌❌ CRITICAL ERROR in playAudio:', error)
      console.error('   Error name:', error.name)
      console.error('   Error message:', error.message)
      console.error('   Stack:', error.stack)
      setIsPlaying(false)
    }
  }

  const handleCritique = async (messageIdx: number) => {
    if (!critiqueInput.trim()) return

    console.log('✏️ User critiquing response:', messages[messageIdx].content.substring(0, 50))
    console.log('   Critique:', critiqueInput)

    try {
      // Save critique as a memory to improve future responses
      await axios.post('/api/memory', {
        userId,
        content: `User feedback: I wouldn't respond like "${messages[messageIdx].content.substring(0, 100)}...". Instead, I would say: "${critiqueInput}"`,
        category: 'correction',
        action: 'add'
      })

      console.log('✅ Critique saved as memory')
      
      // Show success message
      alert('✅ Feedback saved! I\'ll respond more accurately next time.')
      
      // Reset critique state
      setCritiquingIdx(null)
      setCritiqueInput('')
    } catch (error) {
      console.error('❌ Failed to save critique:', error)
      alert('Failed to save feedback. Please try again.')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    console.log('💬 Sending message:', input)

    try {
      // Admin bypass now uses REAL APIs (just skips database auth checks)
      // This allows testing with Fish Audio TTS and Claude personality
      
      // Send message to API
      console.log('📡 Calling /api/speak...')
      console.log('📤 Sending message to /api/speak:')
      console.log('   userId:', userId)
      console.log('   message:', input.substring(0, 50))
      
      const response = await axios.post('/api/speak', {
        userId,
        message: input,
        conversationHistory: messages.slice(-10) // Last 10 messages for context
      }, {
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('═══════════════════════════════════════════════')
      console.log('✅ /api/speak RESPONSE RECEIVED')
      console.log('   Full response:', JSON.stringify(response.data).substring(0, 200))
      console.log('   Text length:', response.data.text?.length || 0)
      console.log('   Text preview:', response.data.text?.substring(0, 100))
      console.log('   Audio URL:', response.data.audioUrl)
      console.log('   Audio URL type:', typeof response.data.audioUrl)
      console.log('   Audio URL length:', response.data.audioUrl?.length || 0)
      console.log('   Is URL absolute?:', response.data.audioUrl?.startsWith('http'))
      console.log('   Is URL relative?:', response.data.audioUrl?.startsWith('/'))
      console.log('═══════════════════════════════════════════════')

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.text,
        audioUrl: response.data.audioUrl
      }

      // Detect emotion from response
      const emotion = detectEmotion(response.data.text)
      console.log('🎭 Detected emotion:', emotion, 'from text:', response.data.text.substring(0, 100))
      setCurrentEmotion(emotion)

      setMessages(prev => [...prev, assistantMessage])

      // Auto-play response
      if (response.data.audioUrl) {
        console.log('🔊 Playing audio:', response.data.audioUrl)
        await playAudio(response.data.audioUrl)
      } else {
        console.warn('⚠️ No audio URL in response - using browser TTS fallback')
        // Fallback to browser text-to-speech if no audio URL
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(response.data.text)
          utterance.rate = 1.0
          utterance.pitch = 1.0
          utterance.volume = 1.0
          window.speechSynthesis.speak(utterance)
        }
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error)
      console.error('Error details:', error.response?.data)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.response?.data?.details || "Sorry, I encountered an error. Please try again."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canInterrupt && !isLoading) {
      e.preventDefault()
      handleSend()
    }
  }

  const stopAudio = () => {
    console.log('⏹️ Manually stopping audio')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setAudioData([])
    setCurrentEmotion('neutral')
    setCanInterrupt(true)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
  }

  return (
    <>
      {/* Audio Permission Prompt */}
      {showAudioPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-dark-card border border-white/30 rounded-2xl p-8 max-w-md mx-4 text-center"
          >
            <div className="mb-4">
              <Volume2 className="w-16 h-16 text-white mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Enable Audio
            </h2>
            <p className="text-gray-300 mb-6">
              Your AI clone will speak with <strong>YOUR VOICE</strong>!
              <br />
              <span className="text-sm text-gray-400 mt-2 block">
                Click below to enable audio playback
              </span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={enableAudio}
              className="w-full bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <Music className="w-5 h-5" />
              Enable Audio & Continue
            </motion.button>
            <p className="text-xs text-gray-500 mt-4">
              Required for voice playback
            </p>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[85vh] max-h-[85vh]">
      {/* Clone Visualization */}
      <div className="bg-dark-surface rounded-lg p-8 glow-border flex flex-col h-full max-h-full overflow-hidden">
        <div className="flex-1 relative min-h-0">
          <FaceWaveform3D
            audioData={audioData}
            isPlaying={isPlaying}
            emotion={currentEmotion}
          />
          
          {/* Emotion Indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <motion.div
              key={currentEmotion}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                currentEmotion === 'joy' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' :
                currentEmotion === 'anger' ? 'bg-red-500/20 border-red-500 text-red-300' :
                currentEmotion === 'sadness' ? 'bg-blue-500/20 border-blue-500 text-blue-300' :
                currentEmotion === 'surprise' ? 'bg-purple-500/20 border-purple-500 text-purple-300' :
                currentEmotion === 'fear' ? 'bg-orange-500/20 border-orange-500 text-orange-300' :
                currentEmotion === 'love' ? 'bg-pink-500/20 border-pink-500 text-pink-300' :
                currentEmotion === 'excitement' ? 'bg-green-500/20 border-green-500 text-green-300' :
                'bg-gray-500/20 border-gray-500 text-gray-300'
              }`}
            >
              Emotion: {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
            </motion.div>
          </div>

          {/* Status Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <motion.div
              animate={{
                scale: isPlaying ? [1, 1.2, 1] : 1,
                opacity: isPlaying ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="px-4 py-2 bg-dark-bg border border-white rounded-full text-sm"
            >
              {isPlaying ? (
                <span className="text-white">Speaking...</span>
              ) : (
                <span className="text-gray-500">Idle</span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Clone Info */}
        <div className="mt-4 text-center text-sm text-gray-400 flex-shrink-0">
          <p>Your AI Clone • Voice & Visual</p>
          <p className="text-xs mt-1">Powered by Fish Audio, Claude & Chroma</p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-dark-surface rounded-lg glow-border flex flex-col h-full max-h-full overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 max-h-full">
          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-dark-bg border border-white text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {/* Critique button for assistant messages (not the initial message) */}
                {message.role === 'assistant' && idx > 0 && (
                  <div className="mt-2 max-w-[80%] w-full">
                    {critiquingIdx === idx ? (
                      <div className="space-y-2">
                        <textarea
                          value={critiqueInput}
                          onChange={(e) => setCritiqueInput(e.target.value)}
                          placeholder="I would respond: ..."
                          className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 text-white text-sm focus:border-white focus:outline-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCritique(idx)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-colors"
                          >
                            Submit Feedback
                          </button>
                          <button
                            onClick={() => {
                              setCritiquingIdx(null)
                              setCritiqueInput('')
                            }}
                            className="px-4 py-2 bg-transparent border border-white/30 text-white rounded-lg text-xs hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCritiquingIdx(idx)}
                        className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        I wouldn't respond like this...
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-dark-bg border border-white rounded-lg p-4">
                <div className="flex gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-dark-border flex-shrink-0">
          {/* Stop button (visible during playback) */}
          {isPlaying && (
            <div className="mb-3 flex justify-center">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopAudio}
                className="px-6 py-2 bg-red-600 border-2 border-red-500 text-white font-bold rounded-lg 
                         hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Speaking
              </motion.button>
            </div>
          )}
          
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canInterrupt ? "Give a scenario: 'Someone cuts you off in traffic. How would you respond?'" : "⏳ Waiting for speech to finish..."}
              rows={2}
              disabled={!canInterrupt}
              className="flex-1 bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white resize-none focus:border-white focus:outline-none text-sm
                       disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <motion.button
              whileHover={{ scale: canInterrupt ? 1.05 : 1 }}
              whileTap={{ scale: canInterrupt ? 0.95 : 1 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !canInterrupt}
              className="px-6 bg-transparent border-2 border-white text-white font-bold rounded-lg 
                       hover:bg-white hover:text-black transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {canInterrupt ? 'Press Enter to send • Shift+Enter for new line' : 'Click "Stop Speaking" to interrupt'}
          </p>
        </div>
      </div>
    </div>
    </>
  )
}


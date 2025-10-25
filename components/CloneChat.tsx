'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import dynamic from 'next/dynamic'

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
}

export default function CloneChat({ userId }: CloneChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm your AI clone. Talk to me like you'd talk to yourself - I'll respond exactly how YOU would. You can also update my knowledge:\n• Say 'I have new stories: [story]' to add context\n• Ask 'How would you respond to [scenario]?' for specific reactions"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral')
  
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
    if (lowerText.match(/\b(hate|annoying|piss|irritat|frustrat|stupid|idiot|damn|hell|screw|fuck|angry|mad|rage)\b/)) return 'anger'
    
    // Concern/worry
    if (lowerText.match(/\b(worried|concerned|anxious|nervous|careful|cautious)\b/)) return 'concern'
    
    // Strong positive emotions
    if (lowerText.match(/\b(happy|joy|awesome|amazing|great|love|excited|thrilled|perfect|fantastic)\b/)) return 'joy'
    
    // Sadness
    if (lowerText.match(/\b(sad|depressed|down|disappointed|sorry|unfortunate)\b/)) return 'sadness'
    
    // Fear
    if (lowerText.match(/\b(scared|afraid|frightened|terrified|fear|panic)\b/)) return 'fear'
    
    // Calm/neutral
    if (lowerText.match(/\b(calm|collected|cool|relax|chill|shrug|no big deal|whatever|fine|okay)\b/)) return 'neutral'
    
    return 'neutral'
  }

  const analyzeAudio = () => {
    if (!analyserRef.current) {
      // No analyzer - generate fake waveform data for visualization
      if (isPlaying) {
        const fakeData = Array.from({ length: 128 }, () => 
          Math.random() * 0.5 + (Math.sin(Date.now() / 100) * 0.25 + 0.25)
        )
        setAudioData(fakeData)
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Normalize to 0-1 range
    const normalized = Array.from(dataArray).map(val => val / 255)
    setAudioData(normalized)

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
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
        analyzeAudio()
      }

      audio.onended = () => {
        console.log('⏹️ Audio ENDED event fired')
        setIsPlaying(false)
        setAudioData([])
      }
      
      audio.onpause = () => {
        console.log('⏸️ Audio PAUSED event fired')
        setIsPlaying(false)
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
                await audioContext.resume()
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    console.log('💬 Sending message:', input)

    try {
      // Send message to API
      console.log('📡 Calling /api/speak...')
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

      console.log('✅ Received response:', response.data)
      console.log('   Text:', response.data.text?.substring(0, 100))
      console.log('   Audio URL:', response.data.audioUrl)

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.text,
        audioUrl: response.data.audioUrl
      }

      // Detect emotion from response
      const emotion = detectEmotion(response.data.text)
      console.log('🎭 Detected emotion:', emotion)
      setCurrentEmotion(emotion)

      setMessages(prev => [...prev, assistantMessage])

      // Auto-play response
      if (response.data.audioUrl) {
        console.log('🔊 Playing audio:', response.data.audioUrl)
        await playAudio(response.data.audioUrl)
      } else {
        console.warn('⚠️ No audio URL in response')
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
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
            <div className="text-6xl mb-4">🔊</div>
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
              className="w-full bg-transparent border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white hover:text-black transition-all"
            >
              🎵 Enable Audio & Continue
            </motion.button>
            <p className="text-xs text-gray-500 mt-4">
              Required for voice playback
            </p>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[80vh]">
      {/* Clone Visualization */}
      <div className="bg-dark-surface rounded-lg p-8 glow-border flex flex-col">
        <div className="flex-1 relative min-h-[600px]">
          <FaceWaveform3D
            audioData={audioData}
            isPlaying={isPlaying}
            emotion={currentEmotion}
          />
          
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
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Your AI Clone • Voice & Visual</p>
          <p className="text-xs mt-1">Powered by Fish Audio, Claude & Chroma</p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-dark-surface rounded-lg glow-border flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-dark-bg border border-white text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Audio auto-plays when response arrives - no button needed */}
                </div>
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
        <div className="p-6 border-t border-dark-border">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Give a scenario: 'Someone cuts you off in traffic. How would you respond?'"
              rows={2}
              className="flex-1 bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white resize-none focus:border-white focus:outline-none text-sm"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
    </>
  )
}


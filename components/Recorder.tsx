'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface RecorderProps {
  onComplete: (audioBlob: Blob) => void
}

export default function Recorder({ onComplete }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [audioLevel, setAudioLevel] = useState(0)
  const [canSubmit, setCanSubmit] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Full paragraph to read (similar to Fish Audio's website - 20-30 seconds)
  const recordingPrompt = "I walk through the park every morning before work. The trees sway gently in the breeze, and birds sing their morning songs. Sometimes I stop to watch a squirrel gather nuts or see dew glistening on spider webs. These quiet moments help me start my day with a clear mind."

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    setAudioLevel(average / 255)

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      // Setup audio analysis
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        onComplete(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setCountdown(30)
      setCanSubmit(false)
      analyzeAudio()
      
      // Countdown timer (30 seconds total, turn green at 10 seconds remaining)
      let timeLeft = 30
      timerRef.current = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        // Turn green when 10 seconds remaining (20 seconds recorded)
        if (timeLeft <= 10) {
          setCanSubmit(true)
        }
        
        if (timeLeft <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          stopRecording()
        }
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Please allow microphone access to continue.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-dark-surface rounded-lg glow-border">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center mb-12 max-w-3xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-white mb-3">
          Voice Recording
        </h2>
        <p className="text-gray-400 mb-8">
          Read the paragraph below clearly and naturally for 30 seconds
        </p>
        
        {/* Reading prompt - always visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-dark-card rounded-xl border border-white/30 shadow-lg"
        >
          <p className="text-white text-sm font-semibold mb-4">
            📖 Please read this paragraph:
          </p>
          <p className="text-white text-xl leading-relaxed">
            {recordingPrompt}
          </p>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-6 border-t border-white/20"
            >
              <p className="text-white text-sm">
                🎤 Recording... Speak clearly and at a natural pace
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Visualizer */}
      <div className="relative w-64 h-64 mb-12 mx-auto">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-white"
          animate={{
            scale: isRecording ? [1, 1.1, 1] : 1,
            opacity: isRecording ? [0.3, 0.6, 0.3] : 0.2,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-white"
          style={{
            scale: 0.3 + audioLevel * 0.7,
            opacity: 0.2 + audioLevel * 0.3,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-6xl font-bold transition-colors duration-300 ${
            isRecording && canSubmit ? 'text-green-400' : 'text-white'
          }`}>
            {isRecording ? countdown : '30'}
          </span>
                  {isRecording && canSubmit && (
                    <div className="absolute -bottom-16 text-green-400 text-sm font-medium">
                      ✅ Ready to submit (20s recorded)
                    </div>
                  )}
        </div>
      </div>

      {/* Control Button */}
      <div className="mt-8">
      {!isRecording ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg 
                     hover:bg-white hover:text-black transition-colors"
        >
          Start Recording
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stopRecording}
          className="px-8 py-4 bg-transparent border-2 border-red-500 text-red-500 font-bold rounded-lg 
                     hover:bg-red-500 hover:text-white transition-colors"
        >
          Stop Early
        </motion.button>
      )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Tips for best results:</p>
        <ul className="mt-2 space-y-1">
          <li>• Find a quiet environment</li>
          <li>• Speak naturally and clearly</li>
          <li>• Use different tones and expressions</li>
        </ul>
      </div>
    </div>
  )
}


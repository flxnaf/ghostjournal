'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Mic, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import { useFaceMesh } from '@/lib/hooks/useFaceMesh'
import { applyMediapipeToMockFace } from '@/lib/applyMediapipeToMock'

interface UploaderProps {
  audioBlob: Blob
  userId: string
  voiceTraining: {
    isTraining: boolean
    progress: number
    status: string
    error: string | null
  }
  onComplete: (userId: string) => void
  onReRecord?: () => void
}

const PHOTO_LABELS = ['Front']

export default function Uploader({ audioBlob, userId, voiceTraining, onComplete, onReRecord }: UploaderProps) {
  const [photos, setPhotos] = useState<(File | null)[]>([null])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingFace, setProcessingFace] = useState(false)
  const [captureMode, setCaptureMode] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [contexts, setContexts] = useState({
    story: '',
    habit: '',
    reaction: ''
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const { processFaceImages, isLoading: isFaceMeshLoading, isReady } = useFaceMesh()

  const startCamera = async () => {
    console.log('🎥 Starting camera...')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      })
      
      console.log('✅ Camera stream obtained:', stream)
      streamRef.current = stream
      setCaptureMode(true)
      setCurrentPhotoIndex(0)
      
      // Set video source after state update
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log('🎬 Setting video source...')
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.error('Video play error:', e))
        }
      }, 100)
    } catch (error) {
      console.error('❌ Camera error:', error)
      alert('Please allow camera access to take selfies.')
    }
  }

  const capturePhoto = () => {
    console.log('📸 Capturing photo', currentPhotoIndex + 1)
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      
      // Check if video is ready
      if (video.readyState < 2) {
        console.warn('⚠️ Video not ready yet')
        alert('Video is loading, please wait a moment...')
        return
      }
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Flip horizontally to match the mirrored preview
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ Photo captured successfully')
            const file = new File([blob], `photo-${currentPhotoIndex}.jpg`, { type: 'image/jpeg' })
            const newPhotos = [...photos]
            newPhotos[currentPhotoIndex] = file
            setPhotos(newPhotos)
            
            // Since we only need 1 photo, finish immediately
            console.log('🎉 Photo captured!')
            stopCamera()
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setCaptureMode(false)
      setCurrentPhotoIndex(0)
    }
  }

  const handleFileUpload = (index: number, file: File) => {
    const newPhotos = [...photos]
    newPhotos[index] = file
    setPhotos(newPhotos)
  }

  const handleSubmit = async () => {
    // Validate
    if (photos.some(p => !p)) {
      alert('Please capture or upload your photo')
      return
    }

    // Check if admin bypass - skip all processing
    const isAdminBypass = localStorage.getItem('adminBypass') === 'true'
    
    if (isAdminBypass) {
      console.log('🔑 Admin bypass - skipping face processing and database')
      setUploading(true)
      setProgress(50)
      
      // Simulate processing
      setTimeout(() => {
        setProgress(100)
        setTimeout(() => {
          setUploading(false)
          onComplete(userId)
        }, 500)
      }, 1000)
      
      return
    }

    setUploading(true)
    setProcessingFace(true)
    setProgress(0)

    try {
      console.log('🎭 Step 1: Extracting face landmarks with MediaPipe...')
      console.log(`   Processing ${photos.filter(p => p !== null).length} photos`)
      console.log(`   FaceMesh hook ready: ${isReady}`)
      console.log(`   FaceMesh hook loading: ${isFaceMeshLoading}`)
      
      // Check if MediaPipe is ready
      if (!isReady) {
        console.error('❌ MediaPipe is not loaded yet!')
        alert('Face detection system is still loading. Please wait a moment and try again.')
        throw new Error('MediaPipe not ready')
      }
      
      // Extract face landmarks from photos using MediaPipe
      const validPhotos = photos.filter(p => p !== null) as File[]
      console.log('   Calling processFaceImages with', validPhotos.length, 'photos...')
      
      const mediapipeResult = await processFaceImages(validPhotos)
      
      console.log('   processFaceImages returned:', mediapipeResult ? 'SUCCESS' : 'NULL')
      
      if (!mediapipeResult) {
        console.error('❌ MediaPipe failed - no result returned')
        alert('Could not detect your face in the photos. Please:\n1. Make sure your face is clearly visible\n2. Use well-lit photos\n3. Face the camera directly')
        throw new Error('MediaPipe face detection failed')
      }

      const { landmarks, contours } = mediapipeResult

      console.log('✅ Face landmarks extracted!')
      console.log(`   Detected ${landmarks ? landmarks.length : 'NO'} raw MediaPipe landmarks`)
      console.log(`   Generated ${contours ? contours.length : 'NO'} contours from ${validPhotos.length} photos`)
      
      if (!landmarks || landmarks.length < 468) {
        console.error(`❌ Invalid MediaPipe data - expected 468 landmarks, got ${landmarks?.length || 0}`)
        alert('Face detection incomplete. Please try again with clearer photos.')
        throw new Error('Invalid MediaPipe landmarks')
      }
      
          console.log('   Sample landmark (point 10):', landmarks[10])
          console.log('   Sample landmark (point 151):', landmarks[151])

          console.log('💇 Step 2: Analyzing hair style with Claude Vision...')
          
          // Analyze hair from the front photo
          const frontPhoto = validPhotos[0]
          const formData = new FormData()
          formData.append('image', frontPhoto)
          
          let hairDescription = null
          try {
            const hairResponse = await axios.post('/api/analyze-hair', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
            hairDescription = hairResponse.data.hairStyle
            console.log('   ✅ Hair style detected:', hairDescription)
          } catch (error) {
            console.warn('   ⚠️  Hair analysis failed, will use face-based generation')
          }

          console.log('🎨 Step 3: Applying real proportions to 2.5D face template...')
      
      // Fetch the mock face template
      const mockResponse = await fetch('/api/mock-face')
      const { contours: mockFaceContours } = await mockResponse.json()
      console.log(`   Fetched ${mockFaceContours.length} mock face contours`)
      
      // CRITICAL DEBUG: Check landmarks before applying
      console.log('📋 BEFORE applying to mock:')
      console.log(`   Raw landmarks count: ${landmarks.length}`)
      console.log(`   Landmark 10 (forehead):`, landmarks[10])
      console.log(`   Landmark 151 (top head):`, landmarks[151])
      console.log(`   Landmark 133 (left eye):`, landmarks[133])
      console.log(`   Landmark 362 (right eye):`, landmarks[362])
      
          // Apply MediaPipe measurements to mock face structure (using RAW landmarks!)
          console.log('   🔄 Calling applyMediapipeToMockFace...')

          let personalizedFace
          try {
            personalizedFace = applyMediapipeToMockFace(landmarks, mockFaceContours, hairDescription)
            console.log('   ✅ applyMediapipeToMockFace completed without errors')
          } catch (error) {
            console.error('   ❌ applyMediapipeToMockFace FAILED:', error)
            console.error('   Error stack:', (error as Error).stack)
            throw error
          }
      
      console.log('📋 AFTER applying to mock:')
      console.log(`   Output: ${personalizedFace.length} contours`)
      
      const jawline = personalizedFace.find(c => c.name === 'jawline')
      const leftEye = personalizedFace.find(c => c.name === 'left_eye_outline')
      const hairFront = personalizedFace.find(c => c.name === 'hair_front')
      
      if (jawline) {
        const jawWidth = Math.max(...jawline.points.map(p => Math.abs(p[0]))) * 2
        console.log(`   Jawline width: ${jawWidth.toFixed(3)} (should NOT be 0.700 for everyone!)`)
        console.log(`   Sample jaw point:`, jawline.points[0])
      }
      
      if (leftEye) {
        console.log(`   Left eye position:`, leftEye.points[0])
      }
      
      if (hairFront) {
        const topHairY = Math.max(...hairFront.points.map(p => p[1]))
        console.log(`   Top hair Y: ${topHairY.toFixed(3)} (higher = spikier)`)
      }
      
      console.log('✅ Created personalized 2.5D face model!')
      
      setProcessingFace(false)
      setProgress(50)

      console.log('📤 Step 3: Uploading face data and initial context...')

      // Send personalized face contours and initial context to API
      const response = await axios.post('/api/update-user', {
        userId,
        faceContours: personalizedFace,
        contexts
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      console.log('✅ Face model and initial context uploaded!')
      setProgress(100)
      
      // Brief pause to show completion, then proceed
      setTimeout(() => {
        setUploading(false)
        onComplete(userId)
      }, 800)
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      console.error('   Error response:', error.response?.data)
      console.error('   Error status:', error.response?.status)
      alert(`Failed to process: ${error.response?.data?.error || error.message}. Please try again.`)
      setUploading(false)
      setProcessingFace(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Photo Capture Section */}
      <div className="bg-dark-surface rounded-lg p-8 glow-border">
        {!captureMode ? (
          /* Initial State - Show Start Button */
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4">
              Capture Your Photo
            </h2>
            <p className="text-gray-400 mb-4">
              Take a clear front-facing photo of yourself
            </p>
            
            {/* Consent Notice */}
            <div className="bg-dark-bg border border-white/20 rounded-lg p-4 mb-6 text-left max-w-2xl mx-auto">
              <p className="text-xs text-gray-300 leading-relaxed mb-2">
                <strong className="text-white">Consent:</strong> You have my full, explicit consent to generate a 3D model of my own face 
                using the images I provided. These images are of me, and I authorize their 
                use for this modeling purpose only.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The uploaded photos were taken by me and depict myself. 
                No third parties are involved or affected.
              </p>
            </div>
            
            {/* Preview of captured photo */}
            <div className="flex justify-center mb-8">
              <div className="text-center">
                <div className="w-64 h-64 bg-dark-bg rounded-lg border-2 border-dark-border 
                              flex items-center justify-center mb-2 overflow-hidden">
                  {photos[0] ? (
                    <img
                      src={URL.createObjectURL(photos[0]!)}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500">Front Photo</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startCamera}
              className="px-12 py-6 bg-transparent border-2 border-white text-white font-bold text-2xl rounded-xl
                       hover:bg-white hover:text-black transition-colors"
            >
              📷 Take Photo
            </motion.button>
          </div>
        ) : (
          /* Camera Mode - Single sliding view */
          <div className="space-y-6">
            {/* Header with progress */}
            <motion.div 
              key={`header-${currentPhotoIndex}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                Look at the Camera
              </h2>
              <p className="text-lg text-gray-400">
                Position your face in the center
              </p>
            </motion.div>

            {/* Video Preview - LARGE AND PROMINENT */}
            <div className="relative bg-black rounded-2xl overflow-hidden border-4 border-white 
                          shadow-2xl shadow-white/20 min-h-[500px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full"
                style={{ 
                  minHeight: '500px',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'scaleX(-1)' // Mirror flip for natural selfie view
                }}
                onLoadedMetadata={() => console.log('📹 Video metadata loaded')}
                onPlay={() => console.log('▶️ Video playing')}
              />
              
              {/* Face guide overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-80 border-4 border-white rounded-full opacity-30 animate-pulse" />
              </div>
              
              {/* Direction instruction - BIG AND CLEAR */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 bg-white text-black 
                          px-8 py-4 rounded-full font-bold text-xl shadow-lg"
              >
                👤 Look straight ahead
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="px-6 py-4 bg-transparent border-2 border-gray-500 text-gray-300 font-bold text-lg rounded-xl 
                         hover:bg-gray-500 hover:text-white transition-colors"
              >
                ✕ Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center
                         shadow-2xl shadow-white/30 hover:bg-gray-200 transition-all
                         border-4 border-gray-300"
                title="Take Photo"
              >
                <div className="w-16 h-16 bg-gray-800 rounded-full" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Initial Context Questions */}
      <div className="bg-dark-surface rounded-lg p-8 glow-border">
        <h2 className="text-3xl font-bold text-white mb-6">
          Tell Us About Yourself
        </h2>
        <p className="text-gray-400 mb-6">
          Help your clone understand you better by sharing some context.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              📖 Tell us a story about yourself
            </label>
            <textarea
              value={contexts.story}
              onChange={(e) => setContexts({ ...contexts, story: e.target.value })}
              rows={3}
              className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white focus:border-white focus:outline-none"
              placeholder="e.g., I grew up in a small town and always loved technology..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              🔄 Describe a daily habit
            </label>
            <textarea
              value={contexts.habit}
              onChange={(e) => setContexts({ ...contexts, habit: e.target.value })}
              rows={3}
              className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white focus:border-white focus:outline-none"
              placeholder="e.g., Every morning I drink coffee and read tech news..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              😊 How do you typically react to challenges?
            </label>
            <textarea
              value={contexts.reaction}
              onChange={(e) => setContexts({ ...contexts, reaction: e.target.value })}
              rows={3}
              className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white focus:border-white focus:outline-none"
              placeholder="e.g., I stay calm and break problems into smaller pieces..."
            />
          </div>
        </div>
      </div>

      {/* Fixed Progress Bar - Bottom Right Corner */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-8 right-8 z-50 bg-dark-card border border-white/30 rounded-xl p-6 shadow-2xl w-96"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5" />
          <span>Voice Training</span>
        </h3>
        
        {/* Voice Training Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className={`font-medium ${voiceTraining.error ? 'text-red-400' : 'text-white'}`}>
              {voiceTraining.status}
            </span>
            <span className="text-white font-bold">{Math.round(voiceTraining.progress)}%</span>
          </div>
          <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden border border-white/30">
            <motion.div
              className={`h-full ${voiceTraining.error ? 'bg-red-400' : 'bg-white'}`}
              initial={{ width: 0 }}
              animate={{ width: `${voiceTraining.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {voiceTraining.error ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-red-400 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Error: {voiceTraining.error}
              </p>
              <p className="text-xs text-gray-400 text-center">
                You can continue without voice training or re-record
              </p>
              {onReRecord && (
                <button
                  onClick={onReRecord}
                  className="w-full py-2 px-4 bg-transparent border border-white/30 text-white text-sm rounded-lg
                           hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Re-record Voice
                </button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              {voiceTraining.progress === 100 ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Voice model ready! Continue with photos below.
                </>
              ) : (
                "Training your custom S1 voice model..."
              )}
            </p>
          )}
        </div>
      </motion.div>

      {/* Submit Button - Below progress bar */}
      <div className="flex flex-col items-center mt-6 space-y-4">
        {/* Consent Confirmation */}
        <div className="bg-dark-bg border border-white/20 rounded-lg p-4 max-w-2xl text-center">
          <p className="text-xs text-gray-300 leading-relaxed mb-2">
            <strong className="text-white">By continuing, you confirm:</strong> You have my full, explicit consent to generate a 3D model of my own face 
            using the images I provided. These images are of me, and I authorize their 
            use for this modeling purpose only.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            The uploaded photos were taken by me and depict myself. 
            No third parties are involved or affected.
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: uploading ? 1 : 1.05 }}
          whileTap={{ scale: uploading ? 1 : 0.95 }}
          onClick={handleSubmit}
          disabled={photos.some(p => !p) || uploading}
          className="px-12 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-lg 
                   hover:bg-white hover:text-black transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingFace ? (
            <span className="flex items-center gap-2">
              <Upload className="w-5 h-5 animate-pulse" />
              Analyzing Your Face...
            </span>
          ) : uploading ? (
            <span className="flex items-center gap-2">
              <Upload className="w-5 h-5 animate-pulse" />
              Uploading...
            </span>
          ) : (
            'I Consent - Create My Clone'
          )}
        </motion.button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}


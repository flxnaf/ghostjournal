'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface FaceWaveform3DProps {
  audioData: number[]
  isPlaying: boolean
  emotion: string
}

interface FaceContour {
  name: string
  points: number[][]
  connects_to: string[]
}

interface FaceData {
  contours: FaceContour[]
}

// Emotion to color mapping - full spectrum
const EMOTION_COLORS: { [key: string]: string } = {
  anger: '#ff3333',      // RED - rage, spazzy
  joy: '#ffdd00',        // YELLOW - happiness, bouncy
  sadness: '#4488ff',    // BLUE - fragile, low energy
  concern: '#ff8800',    // ORANGE - cautious
  fear: '#aa44ff',       // PURPLE - trembling
  disgust: '#88ff44',    // GREEN - unsettled
  surprise: '#00ffff',   // CYAN - shocked
  love: '#ff69b4',       // PINK - warm
  neutral: '#ffffff'     // WHITE - default
}

function WaveformContour({ 
  contour, 
  audioData, 
  isPlaying, 
  emotion 
}: { 
  contour: FaceContour
  audioData: number[]
  isPlaying: boolean
  emotion: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.TubeGeometry | null>(null)
  
  const baseColor = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral
  
  // Create curve from points
  const curve = useMemo(() => {
    if (contour.points.length < 2) {
      console.warn(`⚠️ Contour ${contour.name} has too few points:`, contour.points.length)
      return null
    }
    
    // Normalize and validate points
    const normalizedPoints = contour.points.map(p => {
      if (!Array.isArray(p) || p.length !== 3) return null
      
      let [x, y, z] = p
      
      // Check if points are in pixel space (> 5) and normalize
      if (Math.abs(x) > 5 || Math.abs(y) > 5) {
        // Assume 640x480 image space, normalize to -1 to 1
        x = (x / 320) - 1
        y = 1 - (y / 240)
      }
      
      // Validate after normalization
      if (isNaN(x) || isNaN(y) || isNaN(z) || 
          Math.abs(x) > 2 || Math.abs(y) > 2 || Math.abs(z) > 2) {
        return null
      }
      
      return [x, y, z] as [number, number, number]
    }).filter(p => p !== null) as [number, number, number][]
    
    if (normalizedPoints.length < 2) {
      console.warn(`⚠️ Contour ${contour.name} has no valid points after normalization (${contour.points.length} original)`)
      return null
    }
    
    const vectors = normalizedPoints.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    )
    
    // Close the curve if it's an outline
    if (contour.name.includes('outline') || contour.name === 'jawline') {
      vectors.push(vectors[0].clone())
    }
    
    console.log(`✅ Created curve for ${contour.name}: ${vectors.length} points (${contour.points.length} original)`)
    
    return new THREE.CatmullRomCurve3(vectors, false, 'centripetal')
  }, [contour.points, contour.name])
  
  // Animate based on audio
  // Store original positions for smooth reset
  const originalPositionsRef = useRef<Float32Array | null>(null)
  
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current) return
    
    const positions = geometryRef.current.attributes.position
    
    // Store original positions on first frame
    if (!originalPositionsRef.current) {
      originalPositionsRef.current = positions.array.slice() as Float32Array
    }
    
    const time = state.clock.getElapsedTime()
    
    // Only apply wave effect when playing
    if (isPlaying && audioData.length > 0) {
      // Calculate audio intensity
      const avgAudio = audioData.reduce((a, b) => a + b, 0) / audioData.length
      const intensity = Math.max(0.2, avgAudio * 3)  // Higher baseline and multiplier
      
      // Debug log periodically (every ~2 seconds)
      const currentSecond = Math.floor(state.clock.elapsedTime)
      if (currentSecond % 2 === 0 && state.clock.elapsedTime - currentSecond < 0.05) {
        console.log(`🎵 Audio waveform active: avg=${avgAudio.toFixed(3)}, intensity=${intensity.toFixed(3)}, samples=${audioData.length}`)
      }
      
      // Animate tube radius to create waveform effect
      const count = positions.count
      
      for (let i = 0; i < count; i++) {
        const t = i / count
        // Create wave effect along the contour
        const audioIndex = Math.floor(t * audioData.length)
        const audioValue = audioData[audioIndex] || 0
        
        // Get original position
        const origX = originalPositionsRef.current![i * 3]
        const origY = originalPositionsRef.current![i * 3 + 1]
        const origZ = originalPositionsRef.current![i * 3 + 2]
        
        // Emotion-based wave effect with amplitude + fluctuation control
        let amplitude = 0.08     // Base amplitude
        let smoothness = 1.0     // 1.0 = smooth, 0.0 = spazzy
        let waveFreq1 = 8
        let waveFreq2 = 15
        let timeSpeed = 2
        
        // Adjust based on emotion
        if (emotion === 'anger') {
          amplitude = 0.18       // HIGH amplitude
          smoothness = 0.3       // VERY spazzy/fluctuating
          waveFreq1 = 14         // Fast erratic movements
          waveFreq2 = 22
          timeSpeed = 5
        } else if (emotion === 'joy') {
          amplitude = 0.15       // HIGH amplitude
          smoothness = 0.9       // SMOOTH, consistent bouncing
          waveFreq1 = 5          // Gentle smooth waves
          waveFreq2 = 8
          timeSpeed = 2.5
        } else if (emotion === 'sadness') {
          amplitude = 0.06       // LOW amplitude (fragile but visible)
          smoothness = 0.95      // Smooth and gentle
          waveFreq1 = 3          // Very slow
          waveFreq2 = 5
          timeSpeed = 1.5        // Slightly faster so it's noticeable
        } else if (emotion === 'fear') {
          amplitude = 0.10       // Medium amplitude
          smoothness = 0.4       // Jittery
          waveFreq1 = 16
          waveFreq2 = 24
          timeSpeed = 4
        } else if (emotion === 'concern') {
          amplitude = 0.07       // Low-medium
          smoothness = 0.7       // Moderately smooth
          waveFreq1 = 7
          waveFreq2 = 12
          timeSpeed = 2.2
        } else if (emotion === 'disgust') {
          amplitude = 0.09
          smoothness = 0.5       // Unsteady
          waveFreq1 = 10
          waveFreq2 = 16
          timeSpeed = 3
        } else if (emotion === 'surprise') {
          amplitude = 0.12
          smoothness = 0.2       // Very spiky
          waveFreq1 = 18
          waveFreq2 = 28
          timeSpeed = 6
        } else if (emotion === 'love') {
          amplitude = 0.11       // Medium-high, warm
          smoothness = 0.85      // Smooth and gentle
          waveFreq1 = 4          // Slow, soothing
          waveFreq2 = 7
          timeSpeed = 2
        }
        
        // Generate waves with smoothness control
        const wave1 = Math.sin(t * waveFreq1 + time * timeSpeed) * audioValue * amplitude
        const wave2 = Math.sin(t * waveFreq2 + time * (timeSpeed * 0.8)) * audioValue * (amplitude * 0.4)
        
        // Add random fluctuation based on smoothness (less smooth = more random)
        const randomFactor = (1 - smoothness) * (Math.random() - 0.5) * 0.3
        const wave = (wave1 + wave2) * (1 + randomFactor)
        
        const length = Math.sqrt(origX * origX + origY * origY + origZ * origZ)
        if (length > 0) {
          const scale = 1 + wave
          positions.setXYZ(i, origX * scale, origY * scale, origZ * scale)
        }
      }
      
      // Keep opacity constant - only geometry warps, not visibility
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.9  // Consistent visibility
    } else {
      // When not playing, smoothly return to original positions
      const count = positions.count
      for (let i = 0; i < count; i++) {
        const origX = originalPositionsRef.current![i * 3]
        const origY = originalPositionsRef.current![i * 3 + 1]
        const origZ = originalPositionsRef.current![i * 3 + 2]
        
        const currentX = positions.getX(i)
        const currentY = positions.getY(i)
        const currentZ = positions.getZ(i)
        
        // Smoothly lerp back to original position
        positions.setXYZ(
          i,
          THREE.MathUtils.lerp(currentX, origX, 0.1),
          THREE.MathUtils.lerp(currentY, origY, 0.1),
          THREE.MathUtils.lerp(currentZ, origZ, 0.1)
        )
      }
      
      // Reset opacity
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0.9, 0.05)
    }
    
    positions.needsUpdate = true
  })
  
  if (!curve) return null
  
  // Create tube geometry from curve
  const geometry = useMemo(() => {
    if (!curve) return null
    
    const tubeGeo = new THREE.TubeGeometry(
      curve,
      32,  // tubular segments (reduced for performance)
      0.018, // radius (slightly thicker for visibility at distance)
      6,   // radial segments
      false // closed
    )
    geometryRef.current = tubeGeo
    return tubeGeo
  }, [curve])
  
  if (!geometry) return null
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color={baseColor}
        transparent
        opacity={0.9}
        emissive={baseColor}
        emissiveIntensity={0.6}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

function Face3DModel({ audioData, isPlaying, emotion }: FaceWaveform3DProps) {
  const [faceData, setFaceData] = useState<FaceData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const userId = sessionStorage.getItem('userId')
    if (!userId) {
      console.error('❌ No userId found in sessionStorage')
      console.error('   Available keys:', Object.keys(sessionStorage))
      setLoading(false)
      return
    }
    
    console.log('🎭 Fetching face data for userId:', userId)
    console.log('   API URL:', `/api/analyze-face?userId=${userId}`)
    
    fetch(`/api/analyze-face?userId=${userId}`)
      .then(res => {
        console.log('📡 API Response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('📦 Received data:', data)
        // Determine if this is Claude-generated or mock data
        const isMockData = data.faceData?.contours?.some((c: FaceContour) => 
          c.name === 'jawline' && c.points.length === 11 && 
          Math.abs(c.points[0][0] - (-0.5)) < 0.01
        )
        
        if (isMockData) {
          console.log('%c⚠️ USING MOCK FACE DATA (generic)', 'color: orange; font-size: 14px; font-weight: bold')
          console.log('%cClaude Vision failed to generate valid data', 'color: orange')
        } else {
          console.log('%c✅ USING CLAUDE VISION DATA (your face!)', 'color: lime; font-size: 14px; font-weight: bold')
          console.log('%cThis 3D model is customized to YOUR features!', 'color: lime')
        }
        
        console.log('📊 Face Model Stats:')
        console.log(`   Total contours: ${data.faceData?.contours?.length || 0}`)
        
        if (data.faceData?.contours) {
          const avgPoints = data.faceData.contours.reduce((sum: number, c: FaceContour) => 
            sum + c.points.length, 0) / data.faceData.contours.length
          console.log(`   Average points per contour: ${avgPoints.toFixed(1)}`)
          console.log('   Contour details:')
          data.faceData.contours.forEach((c: FaceContour) => {
            const emoji = c.points.length >= 8 ? '✅' : c.points.length >= 5 ? '⚠️' : '❌'
            console.log(`   ${emoji} ${c.name}: ${c.points.length} points`)
          })
          
          // CRITICAL: Log actual coordinate values to verify personalization
          const jawline = data.faceData.contours.find((c: FaceContour) => c.name === 'jawline')
          const leftEye = data.faceData.contours.find((c: FaceContour) => c.name === 'left_eye_outline')
          const hairFront = data.faceData.contours.find((c: FaceContour) => c.name === 'hair_front')
          
          if (jawline && jawline.points.length > 0) {
            const jawWidth = Math.max(...jawline.points.map((p: [number, number, number]) => Math.abs(p[0]))) * 2
            console.log(`%c🔍 CLIENT RENDER CHECK (CRITICAL):`, 'color: cyan; font-size: 16px; font-weight: bold')
            console.log(`   Jawline width: ${jawWidth.toFixed(3)}`)
            console.log(`   Sample jaw point:`, jawline.points[0])
            console.log(`   ALL jaw points:`, jawline.points.slice(0, 5).map(p => `[${p[0].toFixed(3)}, ${p[1].toFixed(3)}, ${p[2].toFixed(3)}]`))
            console.log(`   DEFAULT mock: width=0.700, point=[-0.350, -0.350, 0.040]`)
            
            // Check if this is the EXACT default mock face
            const isExactDefault = Math.abs(jawWidth - 0.700) < 0.001 &&
                                  Math.abs(jawline.points[0][0] - (-0.35)) < 0.001 &&
                                  Math.abs(jawline.points[0][1] - (-0.35)) < 0.001
            
            if (isExactDefault) {
              console.log('%c❌❌❌ RENDERING DEFAULT MOCK FACE!', 'color: red; font-size: 18px; font-weight: bold; background: yellow; padding: 5px')
              console.log('%c   This means personalized data did NOT load!', 'color: red; font-size: 14px; font-weight: bold')
            } else if (Math.abs(jawWidth - 0.700) < 0.05) {
              console.log(`%c⚠️ VERY CLOSE to default (width ${jawWidth.toFixed(3)})`, 'color: orange; font-size: 14px; font-weight: bold')
              console.log(`   Might be using default OR barely personalized`)
            } else {
              console.log(`%c✅✅✅ RENDERING PERSONALIZED FACE!`, 'color: lime; font-size: 18px; font-weight: bold; background: darkgreen; padding: 5px')
              console.log(`%c   Width: ${jawWidth.toFixed(3)} (different from 0.700)`, 'color: lime; font-size: 14px')
            }
          }
          
          if (leftEye && leftEye.points.length > 0) {
            console.log(`   Left eye position:`, leftEye.points[0])
          }
          
          if (hairFront && hairFront.points.length > 0) {
            const topHairY = Math.max(...hairFront.points.map((p: [number, number, number]) => p[1]))
            console.log(`   Top hair Y: ${topHairY.toFixed(3)}`)
          }
        }
        
        setFaceData(data.faceData)
        setLoading(false)
      })
      .catch(err => {
        console.error('❌ Failed to load face data:', err)
        console.error('   Error details:', err.message, err.stack)
        setLoading(false)
      })
  }, [])
  
  // If no face data after loading, log it
  useEffect(() => {
    if (!loading && !faceData) {
      console.error('⚠️ Face data is null after loading completed')
      console.error('   This means the API call failed or returned invalid data')
    }
  }, [loading, faceData])
  
  useFrame((state) => {
    // Gentle rotation to show 3D depth
    if (state.scene) {
      state.scene.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.15
      state.scene.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05
      state.scene.position.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.02
    }
  })
  
  if (loading) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    )
  }
  
  if (!faceData || !faceData.contours || faceData.contours.length === 0) {
    console.warn('⚠️ No face data available, showing placeholder')
    return (
      <group>
        <mesh>
          <torusGeometry args={[0.5, 0.05, 16, 32]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      </group>
    )
  }
  
  console.log('🎨 Rendering face with', faceData.contours.length, 'contours')
  
  // Render ALL contours for full 3D head (no filtering)
  const visibleContours = faceData.contours
  
  console.log('  Visible contours:', visibleContours.length)
  
  if (visibleContours.length === 0) {
    console.warn('⚠️ No visible contours after filtering!')
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ffff00" wireframe />
        </mesh>
      </group>
    )
  }
  
  return (
    <group scale={1.0} position={[0, 0, 0]}>
      {visibleContours.map((contour, idx) => {
        console.log(`  Rendering contour ${idx}: ${contour.name}`)
        return (
          <WaveformContour
            key={`${contour.name}-${idx}`}
            contour={contour}
            audioData={audioData}
            isPlaying={isPlaying}
            emotion={emotion}
          />
        )
      })}
      
      {/* Add glowing particles for extra effect */}
      {isPlaying && audioData.length > 0 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(
                Array.from({ length: 150 }, () => (Math.random() - 0.5) * 2)
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral}
            size={0.02}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}

export default function FaceWaveform3D({ audioData, isPlaying, emotion }: FaceWaveform3DProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Quickly hide loading overlay once face starts rendering
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5 seconds - just long enough for initial load

    return () => clearTimeout(timeout)
  }, [])
  
  return (
    <div className="w-full h-full min-h-[600px] bg-transparent relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Analyzing your face...</p>
            <p className="text-gray-400 text-sm mt-2">Creating 3D contour model</p>
          </div>
        </div>
      )}
      
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.5s' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, 5]} intensity={0.6} color="#ffffff" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#ffffff" />
        
        <Face3DModel 
          audioData={audioData}
          isPlaying={isPlaying}
          emotion={emotion}
        />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}         // Don't rotate too high
          maxPolarAngle={(2 * Math.PI) / 3}   // Don't rotate too low
          minAzimuthAngle={-Math.PI / 4}      // Limit left rotation (-45°)
          maxAzimuthAngle={Math.PI / 4}       // Limit right rotation (+45°)
        />
      </Canvas>
    </div>
  )
}

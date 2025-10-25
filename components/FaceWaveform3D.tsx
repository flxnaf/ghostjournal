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

// Emotion to color mapping
const EMOTION_COLORS: { [key: string]: string } = {
  anger: '#ff4444',      // Red
  concern: '#ff8800',    // Orange
  joy: '#ffdd00',        // Yellow
  sadness: '#4488ff',    // Blue
  fear: '#8844ff',       // Purple
  neutral: '#ffffff'     // White (default)
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
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !isPlaying || audioData.length === 0) return
    
    const time = state.clock.getElapsedTime()
    
    // Calculate audio intensity
    const avgAudio = audioData.reduce((a, b) => a + b, 0) / audioData.length
    const intensity = Math.max(0.1, avgAudio * 2)
    
    // Animate tube radius to create waveform effect
    const positions = geometryRef.current.attributes.position
    const count = positions.count
    
    for (let i = 0; i < count; i++) {
      const t = i / count
      // Create wave effect along the contour
      const audioIndex = Math.floor(t * audioData.length)
      const audioValue = audioData[audioIndex] || 0
      
      // Modulate position slightly for wave effect
      const wave = Math.sin(t * 10 + time * 3) * audioValue * 0.02
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      
      const length = Math.sqrt(x * x + y * y + z * z)
      if (length > 0) {
        const scale = 1 + wave
        positions.setXYZ(i, x * scale, y * scale, z * scale)
      }
    }
    
    positions.needsUpdate = true
    
    // Pulse the glow
    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.7 + Math.sin(time * 2) * 0.2 * intensity
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
    // Simple timeout for loading state (don't poll API repeatedly)
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 8000) // 8 seconds max loading
    
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
        camera={{ position: [0, 0, 3.2], fov: 50 }}
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

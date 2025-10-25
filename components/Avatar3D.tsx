'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface Avatar3DProps {
  audioData: number[]
  isPlaying: boolean
}

function AudioReactiveSphere({ audioData, isPlaying }: Avatar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return

    // Get average audio level
    const avgAudio = audioData.length > 0
      ? audioData.reduce((a, b) => a + b, 0) / audioData.length
      : 0

    // Distort based on audio
    if (isPlaying && avgAudio > 0) {
      materialRef.current.distort = 0.3 + avgAudio * 0.7
      materialRef.current.speed = 1 + avgAudio * 3
    } else {
      // Idle animation
      materialRef.current.distort = 0.2 + Math.sin(state.clock.elapsedTime) * 0.1
      materialRef.current.speed = 0.5
    }

    // Gentle rotation
    meshRef.current.rotation.y += 0.002
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 128, 128]} />
      <MeshDistortMaterial
        ref={materialRef}
        color="#ffffff"
        attach="material"
        distort={0.3}
        speed={1}
        roughness={0.2}
        metalness={0.8}
        emissive="#ffffff"
        emissiveIntensity={isPlaying ? 0.5 : 0.2}
      />
    </mesh>
  )
}

function ParticleField({ audioData, isPlaying }: Avatar3DProps) {
  const particlesRef = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!particlesRef.current) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const avgAudio = audioData.length > 0
      ? audioData.reduce((a, b) => a + b, 0) / audioData.length
      : 0

    for (let i = 0; i < positions.length; i += 3) {
      const i3 = i / 3
      const audioIndex = Math.floor((i3 / (positions.length / 3)) * audioData.length)
      const audioValue = audioData[audioIndex] || 0

      // Pulse particles based on audio
      const pulse = isPlaying ? audioValue * 0.5 : 0.1
      positions[i] = positions[i] + (Math.random() - 0.5) * 0.002 * (1 + pulse)
      positions[i + 1] = positions[i + 1] + (Math.random() - 0.5) * 0.002 * (1 + pulse)
      positions[i + 2] = positions[i + 2] + (Math.random() - 0.5) * 0.002 * (1 + pulse)
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.rotation.y += 0.0005
  })

  const particleCount = 1000
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

export default function Avatar3D({ audioData, isPlaying }: Avatar3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />

        {/* Main avatar sphere */}
        <AudioReactiveSphere audioData={audioData} isPlaying={isPlaying} />

        {/* Particle field */}
        <ParticleField audioData={audioData} isPlaying={isPlaying} />

        {/* Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={!isPlaying}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}


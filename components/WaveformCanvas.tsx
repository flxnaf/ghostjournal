'use client'

import { useEffect, useRef } from 'react'

interface WaveformCanvasProps {
  audioData?: number[]
  isPlaying: boolean
  faceOutline?: number[][]
}

export default function WaveformCanvas({ 
  audioData = [], 
  isPlaying,
  faceOutline = []
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const drawFrame = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Draw background glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200)
      gradient.addColorStop(0, 'rgba(0, 217, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 217, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, rect.width, rect.height)

      // Draw face outline with waveform
      if (faceOutline.length > 0) {
        drawWaveformOutline(ctx, centerX, centerY, faceOutline, audioData)
      } else {
        // Default ellipse if no face data
        drawWaveformEllipse(ctx, centerX, centerY, audioData)
      }

      // Draw pulsing particles
      if (isPlaying) {
        drawParticles(ctx, centerX, centerY, audioData)
      }

      timeRef.current += 0.05
      animationRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioData, isPlaying, faceOutline])

  const drawWaveformEllipse = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    audioData: number[]
  ) => {
    const baseRadius = 120
    const numPoints = 64

    ctx.beginPath()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.shadowBlur = 15
    ctx.shadowColor = '#ffffff'

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2
      
      // Get audio amplitude for this point
      const dataIndex = Math.floor((i / numPoints) * audioData.length)
      const amplitude = audioData[dataIndex] || 0
      
      // Add waveform displacement
      const displacement = amplitude * 30
      const radius = baseRadius + displacement + Math.sin(timeRef.current + i * 0.2) * 5

      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius * 1.3 // Elongate vertically

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.closePath()
    ctx.stroke()

    // Inner glow
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  const drawWaveformOutline = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outline: number[][],
    audioData: number[]
  ) => {
    if (outline.length === 0) return

    ctx.beginPath()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.shadowBlur = 15
    ctx.shadowColor = '#ffffff'

    outline.forEach((point, i) => {
      // Normalize coordinates (assuming outline is in 0-1 range)
      const x = cx + (point[0] - 0.5) * 300
      const y = cy + (point[1] - 0.5) * 400

      // Get audio amplitude
      const dataIndex = Math.floor((i / outline.length) * audioData.length)
      const amplitude = audioData[dataIndex] || 0
      
      // Displace outward based on amplitude
      const angle = Math.atan2(y - cy, x - cx)
      const displacement = amplitude * 15
      
      const finalX = x + Math.cos(angle) * displacement
      const finalY = y + Math.sin(angle) * displacement

      if (i === 0) {
        ctx.moveTo(finalX, finalY)
      } else {
        ctx.lineTo(finalX, finalY)
      }
    })

    ctx.closePath()
    ctx.stroke()
  }

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    audioData: number[]
  ) => {
    const numParticles = 20
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 + timeRef.current
      const dataIndex = Math.floor((i / numParticles) * audioData.length)
      const amplitude = audioData[dataIndex] || 0
      
      const distance = 150 + amplitude * 50
      const x = cx + Math.cos(angle) * distance
      const y = cy + Math.sin(angle) * distance
      
      ctx.beginPath()
      ctx.arc(x, y, 2 + amplitude * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 255, 245, ${0.3 + amplitude * 0.7})`
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ffffff'
      ctx.fill()
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  )
}


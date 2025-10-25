import { useState, useRef, useCallback } from 'react'

interface UseCameraReturn {
  isActive: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  startCamera: () => Promise<void>
  stopCamera: () => void
  capturePhoto: () => Promise<File | null>
}

export function useCamera(): UseCameraReturn {
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsActive(false)
    }
  }, [])

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current) return null

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { 
            type: 'image/jpeg' 
          })
          resolve(file)
        } else {
          resolve(null)
        }
      }, 'image/jpeg', 0.9)
    })
  }, [])

  return {
    isActive,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto
  }
}


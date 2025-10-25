'use client'

import { useEffect, useRef, useState } from 'react'
import { mediapipeToContours } from './mediapipeTo3D'

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

/**
 * Hook to extract face landmarks from images using MediaPipe Face Mesh
 */
export function useFaceMesh() {
  const [isLoading, setIsLoading] = useState(false)
  const faceMeshRef = useRef<any>(null)

  useEffect(() => {
    // Only load MediaPipe in browser (not during SSR)
    if (typeof window === 'undefined') return
    
    // Load MediaPipe Face Mesh
    const loadFaceMesh = async () => {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh')
        const faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          }
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        faceMeshRef.current = faceMesh
        console.log('✅ MediaPipe Face Mesh loaded')
      } catch (error) {
        console.error('❌ Failed to load MediaPipe Face Mesh:', error)
      }
    }

    loadFaceMesh()
  }, [])

  /**
   * Process an image and extract face landmarks
   */
  const processFaceImage = async (imageFile: File): Promise<FaceContour[] | null> => {
    if (!faceMeshRef.current) {
      console.error('MediaPipe Face Mesh not loaded yet')
      return null
    }

    setIsLoading(true)

    try {
      // Load image
      const img = await loadImage(imageFile)
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Process with MediaPipe
      return new Promise((resolve) => {
        faceMeshRef.current.onResults((results: any) => {
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            console.warn('⚠️ No face detected in image')
            resolve(null)
            return
          }

          const landmarks = results.multiFaceLandmarks[0]
          console.log(`✅ Detected ${landmarks.length} face landmarks`)
          
          // Convert to our 3D contours
          const contours = mediapipeToContours(landmarks)
          console.log(`✅ Converted to ${contours.length} contours`)
          
          resolve(contours)
        })

        faceMeshRef.current.send({ image: canvas })
      })
    } catch (error) {
      console.error('❌ Error processing face:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Process multiple images and average the landmarks (more accurate)
   */
  const processFaceImages = async (imageFiles: File[]): Promise<FaceContour[] | null> => {
    console.log(`🎭 Processing ${imageFiles.length} images for face extraction...`)
    
    const allContours: FaceContour[][] = []
    
    for (let i = 0; i < imageFiles.length; i++) {
      console.log(`  Processing image ${i + 1}/${imageFiles.length}...`)
      const contours = await processFaceImage(imageFiles[i])
      if (contours) {
        allContours.push(contours)
      }
    }

    if (allContours.length === 0) {
      console.error('❌ No faces detected in any image')
      return null
    }

    console.log(`✅ Successfully processed ${allContours.length}/${imageFiles.length} images`)
    
    // Average the landmarks from all images for better accuracy
    if (allContours.length === 1) {
      return allContours[0]
    }

    return averageContours(allContours)
  }

  return {
    processFaceImage,
    processFaceImages,
    isLoading,
    isReady: !!faceMeshRef.current
  }
}

/**
 * Helper: Load image from File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Helper: Average multiple contours for better accuracy
 */
function averageContours(contoursArray: FaceContour[][]): FaceContour[] {
  const numSamples = contoursArray.length
  const averaged: FaceContour[] = []

  // Assume all have same structure
  const template = contoursArray[0]
  
  for (let i = 0; i < template.length; i++) {
    const contourName = template[i].name
    const numPoints = template[i].points.length
    const avgPoints: [number, number, number][] = []

    for (let p = 0; p < numPoints; p++) {
      let sumX = 0, sumY = 0, sumZ = 0

      for (const contours of contoursArray) {
        const point = contours[i]?.points[p]
        if (point) {
          sumX += point[0]
          sumY += point[1]
          sumZ += point[2]
        }
      }

      avgPoints.push([
        sumX / numSamples,
        sumY / numSamples,
        sumZ / numSamples
      ])
    }

    averaged.push({
      name: contourName,
      points: avgPoints,
      connects_to: template[i].connects_to
    })
  }

  console.log('✅ Averaged landmarks from multiple images')
  return averaged
}


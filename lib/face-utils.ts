/**
 * Face detection and processing utilities
 * 
 * For full implementation, integrate face-api.js or OpenCV
 */

export interface FaceLandmarks {
  jawOutline: number[][]
  leftEyebrow: number[][]
  rightEyebrow: number[][]
  noseBridge: number[][]
  leftEye: number[][]
  rightEye: number[][]
  mouth: number[][]
}

export function generateMockLandmarks(): FaceLandmarks {
  return {
    jawOutline: generateEllipsePoints(40, 0.5, 0.55, 0.25, 0.35),
    leftEyebrow: generateLinePoints(5, 0.35, 0.35, 0.42, 0.33),
    rightEyebrow: generateLinePoints(5, 0.58, 0.33, 0.65, 0.35),
    noseBridge: generateLinePoints(4, 0.5, 0.4, 0.5, 0.55),
    leftEye: generateEllipsePoints(8, 0.38, 0.4, 0.04, 0.02),
    rightEye: generateEllipsePoints(8, 0.62, 0.4, 0.04, 0.02),
    mouth: generateEllipsePoints(12, 0.5, 0.7, 0.1, 0.04)
  }
}

function generateEllipsePoints(
  numPoints: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number[][] {
  const points: number[][] = []
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2
    const x = cx + Math.cos(angle) * rx
    const y = cy + Math.sin(angle) * ry
    points.push([x, y])
  }
  return points
}

function generateLinePoints(
  numPoints: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number[][] {
  const points: number[][] = []
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t
    points.push([x, y])
  }
  return points
}

export function normalizeLandmarks(
  landmarks: number[][],
  imageWidth: number,
  imageHeight: number
): number[][] {
  return landmarks.map(([x, y]) => [
    x / imageWidth,
    y / imageHeight
  ])
}

export function scaleAndCenterLandmarks(
  landmarks: number[][],
  targetWidth: number,
  targetHeight: number
): number[][] {
  if (landmarks.length === 0) return []
  
  // Find bounding box
  const xs = landmarks.map(p => p[0])
  const ys = landmarks.map(p => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  const width = maxX - minX
  const height = maxY - minY
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  
  // Scale to fit target dimensions while maintaining aspect ratio
  const scale = Math.min(targetWidth / width, targetHeight / height) * 0.8
  
  return landmarks.map(([x, y]) => [
    (x - centerX) * scale + targetWidth / 2,
    (y - centerY) * scale + targetHeight / 2
  ])
}

/**
 * INTEGRATION GUIDE for face-api.js:
 * 
 * import * as faceapi from 'face-api.js'
 * 
 * // Load models (do this once on startup)
 * await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
 * await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
 * 
 * // Detect face
 * const img = await faceapi.fetchImage(imageUrl)
 * const detection = await faceapi
 *   .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
 *   .withFaceLandmarks()
 * 
 * // Extract landmarks
 * const jawOutline = detection.landmarks.getJawOutline()
 * const leftEye = detection.landmarks.getLeftEye()
 * // etc...
 */


/**
 * Apply MediaPipe measurements to the mock face template
 * This takes real face proportions and applies them to a proper 3D structure
 */

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

interface MediaPipeLandmarks {
  landmarks: any[]  // Raw MediaPipe landmarks
}

/**
 * Extract key measurements from MediaPipe landmarks
 */
function extractFaceMeasurements(landmarks: any[]) {
  // MediaPipe key landmark indices (0-based, normalized 0-1)
  const leftEye = landmarks[33]    // Left eye inner corner
  const rightEye = landmarks[263]  // Right eye inner corner
  const noseTip = landmarks[4]
  const noseBridge = landmarks[6]
  const leftMouth = landmarks[61]
  const rightMouth = landmarks[291]
  const chin = landmarks[152]
  const forehead = landmarks[10]
  const leftJaw = landmarks[234]
  const rightJaw = landmarks[454]
  const leftEyebrow = landmarks[70]
  const rightEyebrow = landmarks[300]
  
  // Calculate normalized measurements (relative ratios, not absolute)
  const eyeDistance = Math.abs(rightEye.x - leftEye.x)
  const faceHeight = Math.abs(chin.y - forehead.y)
  const faceWidth = Math.abs(rightJaw.x - leftJaw.x)
  
  const noseLength = Math.abs(noseTip.y - noseBridge.y)
  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x)
  const eyeHeight = leftEye.y  // Relative position of eyes on face
  const nosePosition = noseTip.y
  const mouthPosition = leftMouth.y
  
  // Calculate face shape (width to height ratio)
  const faceRatio = faceWidth / faceHeight
  const isRoundFace = faceRatio > 0.75  // Wider face = rounder
  
  // Calculate depth estimates from z-coordinates (MediaPipe gives relative depth)
  const avgCheekDepth = (landmarks[234].z + landmarks[454].z) / 2
  const noseDepth = noseTip.z
  const chinDepth = chin.z
  
  return {
    eyeDistance,
    faceHeight,
    faceWidth,
    faceRatio,
    isRoundFace,
    noseLength,
    mouthWidth,
    eyeHeight,
    nosePosition,
    mouthPosition,
    avgCheekDepth,
    noseDepth,
    chinDepth
  }
}

/**
 * Apply MediaPipe measurements to modify the mock face contours
 */
export function applyMediapipeToMockFace(
  mediapipeContours: FaceContour[],
  mockFaceContours: FaceContour[]
): FaceContour[] {
  console.log('🎭 Applying MediaPipe measurements to mock face template...')
  
  // Extract MediaPipe landmarks from the contours
  // (MediaPipe contours from our mapping have the raw landmark data)
  const allPoints = mediapipeContours.flatMap(c => c.points)
  
  if (allPoints.length < 100) {
    console.warn('⚠️ Not enough MediaPipe data, using mock face as-is')
    return mockFaceContours
  }
  
  // Reconstruct landmarks array (this is approximate - ideally we'd pass landmarks directly)
  // For now, extract key measurements from the contours we have
  const jawline = mediapipeContours.find(c => c.name === 'jawline')
  const leftEye = mediapipeContours.find(c => c.name === 'left_eye_outline')
  const rightEye = mediapipeContours.find(c => c.name === 'right_eye_outline')
  const nose = mediapipeContours.find(c => c.name === 'nose_tip')
  const mouth = mediapipeContours.find(c => c.name === 'mouth_outline')
  
  if (!jawline || !leftEye || !rightEye || !nose || !mouth) {
    console.warn('⚠️ Missing key contours, using mock face')
    return mockFaceContours
  }
  
  // Calculate measurements from contours
  const leftEyeCenter = leftEye.points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
    .map(v => v / leftEye.points.length) as [number, number, number]
  const rightEyeCenter = rightEye.points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
    .map(v => v / rightEye.points.length) as [number, number, number]
  
  const eyeDistance = Math.abs(rightEyeCenter[0] - leftEyeCenter[0])
  const faceWidth = Math.max(...jawline.points.map(p => Math.abs(p[0]))) * 2
  const faceHeight = Math.abs(jawline.points[0][1] - jawline.points[jawline.points.length - 1][1])
  
  const faceRatio = faceWidth / faceHeight
  const isRoundFace = faceRatio > 0.85
  
  const noseWidth = Math.max(...nose.points.map(p => Math.abs(p[0]))) * 2
  const mouthWidth = Math.max(...mouth.points.map(p => Math.abs(p[0]))) * 2
  
  console.log('📊 Extracted measurements:')
  console.log(`   Face ratio: ${faceRatio.toFixed(2)} (${isRoundFace ? 'round' : 'angular'})`)
  console.log(`   Eye distance: ${eyeDistance.toFixed(3)}`)
  console.log(`   Nose width: ${noseWidth.toFixed(3)}`)
  console.log(`   Mouth width: ${mouthWidth.toFixed(3)}`)
  
  // Apply measurements to mock face
  const scaledMockFace = mockFaceContours.map(contour => {
    const scaledPoints = contour.points.map(([x, y, z]) => {
      let newX = x
      let newY = y
      let newZ = z
      
      // Scale based on contour type
      if (contour.name.includes('jaw')) {
        // Adjust jawline based on face shape
        newX = x * (faceWidth / 1.0)  // Base mock width is ~1.0
        newZ = isRoundFace ? z * 0.8 : z * 1.1  // Rounder = less depth
      }
      else if (contour.name.includes('eye')) {
        // Adjust eye spacing
        const eyeScale = eyeDistance / 0.7  // Base mock eye distance
        newX = x * eyeScale
      }
      else if (contour.name.includes('nose')) {
        // Adjust nose size
        const noseScale = noseWidth / 0.2  // Base mock nose width
        newX = x * noseScale
      }
      else if (contour.name.includes('mouth')) {
        // Adjust mouth size
        const mouthScale = mouthWidth / 0.56  // Base mock mouth width
        newX = x * mouthScale
      }
      else if (contour.name.includes('hair') || contour.name.includes('ear')) {
        // Scale with overall face width
        newX = x * (faceWidth / 1.0)
      }
      
      return [newX, newY, newZ] as [number, number, number]
    })
    
    return {
      ...contour,
      points: scaledPoints
    }
  })
  
  console.log('✅ Applied MediaPipe proportions to mock face structure')
  return scaledMockFace
}


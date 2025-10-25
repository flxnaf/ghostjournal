/**
 * Apply MediaPipe measurements to the mock face template
 * This creates a 2.5D face that looks accurate from the front
 */

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

/**
 * Extract key measurements from RAW MediaPipe landmarks (0-1 range)
 */
function extractFaceMeasurements(landmarks: any[]) {
  // MediaPipe key landmark indices (0-based, normalized 0-1 range)
  const leftEyeInner = landmarks[133]
  const rightEyeInner = landmarks[362]
  const leftEyeOuter = landmarks[33]
  const rightEyeOuter = landmarks[263]
  const noseTip = landmarks[4]
  const noseBridge = landmarks[168]
  const leftMouth = landmarks[61]
  const rightMouth = landmarks[291]
  const topLip = landmarks[13]
  const bottomLip = landmarks[14]
  const chin = landmarks[152]
  const forehead = landmarks[10]
  const leftJaw = landmarks[234]
  const rightJaw = landmarks[454]
  
  // Calculate measurements in 0-1 space (MediaPipe's original range)
  const eyeDistance = Math.abs(rightEyeInner.x - leftEyeInner.x)
  const faceWidth = Math.abs(rightJaw.x - leftJaw.x)
  const faceHeight = Math.abs(forehead.y - chin.y)
  
  const noseWidth = Math.abs(landmarks[129].x - landmarks[358].x) // Nose nostrils
  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x)
  const mouthHeight = Math.abs(topLip.y - bottomLip.y)
  
  const eyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x)
  
  // Face shape ratio
  const faceRatio = faceWidth / faceHeight
  
  console.log('📏 RAW MediaPipe Measurements (0-1 normalized space):')
  console.log(`   Face width: ${faceWidth.toFixed(4)}`)
  console.log(`   Face height: ${faceHeight.toFixed(4)}`)
  console.log(`   Face ratio: ${faceRatio.toFixed(4)}`)
  console.log(`   Eye distance: ${eyeDistance.toFixed(4)}`)
  console.log(`   Nose width: ${noseWidth.toFixed(4)}`)
  console.log(`   Mouth width: ${mouthWidth.toFixed(4)}`)
  console.log('   📍 Key landmark positions:')
  console.log(`      Left eye inner: (${leftEyeInner.x.toFixed(3)}, ${leftEyeInner.y.toFixed(3)})`)
  console.log(`      Right eye inner: (${rightEyeInner.x.toFixed(3)}, ${rightEyeInner.y.toFixed(3)})`)
  console.log(`      Forehead: (${forehead.x.toFixed(3)}, ${forehead.y.toFixed(3)})`)
  console.log(`      Chin: (${chin.x.toFixed(3)}, ${chin.y.toFixed(3)})`)
  
  return {
    eyeDistance,
    faceWidth,
    faceHeight,
    faceRatio,
    noseWidth,
    mouthWidth,
    mouthHeight,
    eyeWidth
  }
}

/**
 * Apply MediaPipe measurements to modify the mock face contours
 * Now accepts RAW landmarks for accurate measurements
 */
export function applyMediapipeToMockFace(
  rawLandmarks: any[],
  mockFaceContours: FaceContour[]
): FaceContour[] {
  console.log('🎭 Applying MediaPipe measurements to 2.5D face template...')
  console.log(`   Processing ${rawLandmarks.length} landmarks`)
  
  if (!rawLandmarks || rawLandmarks.length < 468) {
    console.warn('⚠️ Invalid MediaPipe data, using default mock face')
    return mockFaceContours
  }
  
  // Extract measurements from raw landmarks
  const measurements = extractFaceMeasurements(rawLandmarks)
  
  // Calculate scaling factors relative to mock face "standard" proportions
  // MediaPipe typical measurements (in 0-1 space)
  const MEDIAPIPE_BASE_FACE_WIDTH = 0.6
  const MEDIAPIPE_BASE_EYE_DISTANCE = 0.15
  const MEDIAPIPE_BASE_NOSE_WIDTH = 0.04
  const MEDIAPIPE_BASE_MOUTH_WIDTH = 0.13
  
  let faceWidthScale = measurements.faceWidth / MEDIAPIPE_BASE_FACE_WIDTH
  let eyeScale = measurements.eyeDistance / MEDIAPIPE_BASE_EYE_DISTANCE
  let noseScale = measurements.noseWidth / MEDIAPIPE_BASE_NOSE_WIDTH
  let mouthScale = measurements.mouthWidth / MEDIAPIPE_BASE_MOUTH_WIDTH
  
  // Clamp scaling to reasonable bounds but ALLOW MORE VARIATION for distinctiveness
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))
  const rawFaceWidth = faceWidthScale
  const rawEye = eyeScale
  const rawNose = noseScale
  const rawMouth = mouthScale
  
  // Use WIDER range (0.7-1.4x) to make faces more distinguishable
  faceWidthScale = clamp(faceWidthScale, 0.7, 1.4)
  eyeScale = clamp(eyeScale, 0.7, 1.4)
  noseScale = clamp(noseScale, 0.7, 1.4)
  mouthScale = clamp(mouthScale, 0.7, 1.4)
  
  // Calculate hair style from MediaPipe landmarks
  // Detect if hair goes UP (spiky) or DOWN (flat) by looking at top head landmarks
  const topHead = rawLandmarks[10]  // Forehead top
  const hairlineTop = rawLandmarks[151] // Top of head
  
  // If hairline is significantly higher than forehead = spiky/up hair
  // If hairline is close to forehead = flat/down hair
  const hairDirection = (hairlineTop.y < topHead.y - 0.05) ? 'up' : 'down'
  const hairSpikyFactor = hairDirection === 'up' ? 1.4 : 0.9  // Spiky = stretch upward
  
  console.log(`   🎨 Hair style detected: ${hairDirection} (spiky factor: ${hairSpikyFactor.toFixed(2)}x)`)
  
  // Hair length and width variation
  const hairLengthMultiplier = 0.8 + (measurements.faceHeight * 1.5)
  const hairWidthMultiplier = 0.9 + (measurements.faceWidth * 0.8)
  const hairClamp = clamp(hairLengthMultiplier, 0.7, 1.5)
  const hairWidthClamp = clamp(hairWidthMultiplier, 0.8, 1.3)
  
  console.log('📊 RAW scaling factors (before clamp):')
  console.log(`   Face width: ${rawFaceWidth.toFixed(2)}x`)
  console.log(`   Eye spacing: ${rawEye.toFixed(2)}x`)
  console.log(`   Nose: ${rawNose.toFixed(2)}x`)
  console.log(`   Mouth: ${rawMouth.toFixed(2)}x`)
  console.log('📊 APPLIED scaling factors (clamped 0.7-1.4x):')
  console.log(`   Face width: ${faceWidthScale.toFixed(3)}x (raw: ${rawFaceWidth.toFixed(3)}x)`)
  console.log(`   Eye spacing: ${eyeScale.toFixed(3)}x (raw: ${rawEye.toFixed(3)}x)`)
  console.log(`   Nose: ${noseScale.toFixed(3)}x (raw: ${rawNose.toFixed(3)}x)`)
  console.log(`   Mouth: ${mouthScale.toFixed(3)}x (raw: ${rawMouth.toFixed(3)}x)`)
  console.log(`   Hair length: ${hairClamp.toFixed(3)}x`)
  console.log(`   Hair width: ${hairWidthClamp.toFixed(3)}x`)
  console.log('   ⚠️  If all scales are ~1.000x, face will look identical to mock!')
  
  // Apply proportional scaling to mock face (2.5D approach)
  const scaledMockFace = mockFaceContours.map(contour => {
    const scaledPoints = contour.points.map(([x, y, z]) => {
      let newX = x
      let newY = y
      let newZ = z * 0.5  // Reduce depth for 2.5D effect
      
      // Apply feature-specific scaling
      if (contour.name.includes('jaw') || contour.name.includes('chin') || 
          contour.name.includes('cheek') || contour.name.includes('forehead')) {
        // Overall face structure
        newX = x * faceWidthScale
        newY = y  // Keep vertical proportions
      }
      else if (contour.name.includes('eye')) {
        // Eyes: scale X position based on eye distance
        newX = x * eyeScale
      }
      else if (contour.name.includes('eyebrow')) {
        // Eyebrows follow eye spacing
        newX = x * eyeScale
      }
      else if (contour.name.includes('nose')) {
        // Nose: scale based on nose width
        newX = x * noseScale
      }
      else if (contour.name.includes('mouth')) {
        // Mouth: scale based on mouth width
        newX = x * mouthScale
      }
      else if (contour.name.includes('hair')) {
        // Hair: scale width AND apply spiky/flat styling
        newX = x * hairWidthClamp
        
        // Apply hair direction styling
        if (y > 0.4) {  // Upper hair (above forehead)
          // Spiky hair = stretch UPWARD, flat hair = compress downward
          newY = y * hairSpikyFactor
        } else if (y < 0) {  // Lower hair (sides, below forehead)
          // Side/bottom hair follows length
          newY = y * hairClamp
        }
      }
      else if (contour.name.includes('neck')) {
        // Neck scales with face width
        newX = x * faceWidthScale
      }
      
      return [newX, newY, newZ] as [number, number, number]
    })
    
    return {
      ...contour,
      points: scaledPoints
    }
  })
  
  console.log('✅ Applied real face proportions to 2.5D mock structure')
  return scaledMockFace
}


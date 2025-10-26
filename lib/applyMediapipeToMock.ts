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

interface HairStyle {
  length: string
  volume: string
  direction: string
  texture: string
  style: string
}

/**
 * Apply MediaPipe measurements to modify the mock face contours
 * Now accepts RAW landmarks for accurate measurements + hair description from Claude
 */
export function applyMediapipeToMockFace(
  rawLandmarks: any[],
  mockFaceContours: FaceContour[],
  hairDescription?: HairStyle | null
): FaceContour[] {
  console.log('🎭 Applying MediaPipe measurements to 2.5D face template...')
  console.log(`   Processing ${rawLandmarks.length} landmarks`)
  
  if (!rawLandmarks || rawLandmarks.length < 468) {
    console.warn('⚠️ Invalid MediaPipe data, using default mock face')
    return mockFaceContours
  }
  
  // Extract measurements from raw landmarks
  const measurements = extractFaceMeasurements(rawLandmarks)
  
  // USE RELATIVE PROPORTIONS instead of absolute frame measurements
  // This makes faces look natural regardless of camera distance
  
  // Key insight: Use ratios WITHIN the face, not absolute frame positions
  const eyeDistanceToFaceWidth = measurements.eyeDistance / measurements.faceWidth
  const noseToFaceWidth = measurements.noseWidth / measurements.faceWidth
  const mouthToFaceWidth = measurements.mouthWidth / measurements.faceWidth
  const faceAspectRatio = measurements.faceWidth / measurements.faceHeight
  
  // Typical proportions (these are actual human face ratios)
  const TYPICAL_EYE_TO_FACE = 0.25  // Eyes are ~25% of face width apart
  const TYPICAL_NOSE_TO_FACE = 0.30  // Nose is ~30% of face width
  const TYPICAL_MOUTH_TO_FACE = 0.35 // Mouth is ~35% of face width
  const TYPICAL_ASPECT_RATIO = 0.75  // Face width / height ratio
  
  // Calculate scales based on INTERNAL face proportions
  let faceWidthScale = faceAspectRatio / TYPICAL_ASPECT_RATIO
  let eyeScale = eyeDistanceToFaceWidth / TYPICAL_EYE_TO_FACE
  let noseScale = noseToFaceWidth / TYPICAL_NOSE_TO_FACE
  let mouthScale = mouthToFaceWidth / TYPICAL_MOUTH_TO_FACE
  
  // Apply reasonable bounds to prevent extreme distortion while allowing variation
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))
  const rawFaceWidth = faceWidthScale
  const rawEye = eyeScale
  const rawNose = noseScale
  const rawMouth = mouthScale
  
  faceWidthScale = clamp(faceWidthScale, 0.7, 1.4)  // 30% narrower to 40% wider
  eyeScale = clamp(eyeScale, 0.7, 1.4)
  noseScale = clamp(noseScale, 0.7, 1.4)
  mouthScale = clamp(mouthScale, 0.7, 1.4)
  
  // GENERATE HAIR STYLE from Claude Vision analysis or fallback to face-based
  let hairHeight = 1.0      // How tall/voluminous (0.5-1.6)
  let hairWidth = 1.0       // How wide it spreads (0.8-1.3)
  let hairSpikiness = 0.0   // How spiky vs flat (-0.4 to 0.6)
  let hairDensity = 1.0     // How many hair lines (0.7-1.3)
  let hairStyleName = 'Medium'
  
  if (hairDescription) {
    console.log(`   💇 Using REAL hair analysis from photo: "${hairDescription.style}"`)
    console.log(`      Length: ${hairDescription.length}, Volume: ${hairDescription.volume}, Direction: ${hairDescription.direction}, Texture: ${hairDescription.texture}`)
    
    // Map LENGTH
    const length = hairDescription.length.toLowerCase()
    if (length.includes('very short')) {
      hairHeight = 0.55
      hairStyleName = 'Very Short'
    } else if (length.includes('short')) {
      hairHeight = 0.7
      hairStyleName = 'Short'
    } else if (length.includes('long') || length.includes('very long')) {
      hairHeight = 1.4
      hairStyleName = 'Long'
    } else {
      hairHeight = 1.0
      hairStyleName = 'Medium'
    }
    
    // Map VOLUME
    const volume = hairDescription.volume.toLowerCase()
    if (volume.includes('flat') || volume.includes('low')) {
      hairWidth = 0.85
      hairDensity = 0.75
    } else if (volume.includes('high') || volume.includes('very high')) {
      hairWidth = 1.25
      hairDensity = 1.25
      hairHeight *= 1.2  // High volume = taller too
    } else {
      hairWidth = 1.0
      hairDensity = 1.0
    }
    
    // Map DIRECTION
    const direction = hairDescription.direction.toLowerCase()
    if (direction.includes('up') || direction.includes('spiky')) {
      hairSpikiness = 0.5
      hairStyleName += '/Spiky'
    } else if (direction.includes('down') || direction.includes('flat')) {
      hairSpikiness = -0.35
      hairStyleName += '/Flat'
    } else if (direction.includes('messy')) {
      hairSpikiness = 0.2
      hairWidth *= 1.1
      hairStyleName += '/Messy'
    } else {
      hairSpikiness = 0.0
    }
    
    // Map TEXTURE
    const texture = hairDescription.texture.toLowerCase()
    if (texture.includes('curly') || texture.includes('very curly')) {
      hairWidth *= 1.15
      hairDensity *= 1.2
      hairStyleName += '/Curly'
    } else if (texture.includes('wavy')) {
      hairWidth *= 1.05
      hairStyleName += '/Wavy'
    }
    
  } else {
    // FALLBACK: Generate diverse styles based on face characteristics
    console.log('   💇 No hair analysis available, using face-based generation')
    
    const hairSeed = Math.floor((measurements.faceWidth * 1000 + measurements.faceHeight * 1000 + measurements.faceRatio * 1000) % 100)
    const hairStyleType = hairSeed % 6
    
    if (hairStyleType === 0) {
      hairHeight = 0.7; hairWidth = 0.9; hairSpikiness = -0.2; hairDensity = 0.8; hairStyleName = 'Short/Neat'
    } else if (hairStyleType === 1) {
      hairHeight = 1.4; hairWidth = 1.15; hairSpikiness = 0.3; hairDensity = 1.2; hairStyleName = 'Tall/Voluminous'
    } else if (hairStyleType === 2) {
      hairHeight = 1.3; hairWidth = 0.95; hairSpikiness = 0.5; hairDensity = 0.9; hairStyleName = 'Spiky/Up'
    } else if (hairStyleType === 3) {
      hairHeight = 0.9; hairWidth = 1.25; hairSpikiness = -0.1; hairDensity = 1.1; hairStyleName = 'Wide/Swept'
    } else if (hairStyleType === 4) {
      hairHeight = 1.1; hairWidth = 1.05; hairSpikiness = 0.1; hairDensity = 1.15; hairStyleName = 'Medium/Wavy'
    } else {
      hairHeight = 0.65; hairWidth = 0.85; hairSpikiness = -0.3; hairDensity = 0.75; hairStyleName = 'Flat/Close'
    }
  }
  
  console.log(`   💇 Final hair style: "${hairStyleName}"`)
  console.log(`      Height: ${hairHeight.toFixed(2)}x, Width: ${hairWidth.toFixed(2)}x, Spikiness: ${hairSpikiness.toFixed(2)}, Density: ${hairDensity.toFixed(2)}`)
  
  // Clamp hair values to reasonable bounds
  hairHeight = clamp(hairHeight, 0.5, 1.6)
  hairWidth = clamp(hairWidth, 0.8, 1.35)
  hairSpikiness = clamp(hairSpikiness, -0.4, 0.6)
  hairDensity = clamp(hairDensity, 0.7, 1.3)

  console.log('📊 FACE-RELATIVE PROPORTIONS (internal ratios):')
  console.log(`   Eye-to-face ratio: ${eyeDistanceToFaceWidth.toFixed(3)} (typical: ${TYPICAL_EYE_TO_FACE})`)
  console.log(`   Nose-to-face ratio: ${noseToFaceWidth.toFixed(3)} (typical: ${TYPICAL_NOSE_TO_FACE})`)
  console.log(`   Mouth-to-face ratio: ${mouthToFaceWidth.toFixed(3)} (typical: ${TYPICAL_MOUTH_TO_FACE})`)
  console.log(`   Face aspect ratio: ${faceAspectRatio.toFixed(3)} (typical: ${TYPICAL_ASPECT_RATIO})`)
  console.log('📊 RAW scaling factors (before clamp):')
  console.log(`   Face width: ${rawFaceWidth.toFixed(3)}x, Eye: ${rawEye.toFixed(3)}x, Nose: ${rawNose.toFixed(3)}x, Mouth: ${rawMouth.toFixed(3)}x`)
  console.log('📊 APPLIED scaling factors (clamped 0.7-1.4x for natural look):')
  console.log(`   Face width: ${faceWidthScale.toFixed(3)}x`)
  console.log(`   Eye spacing: ${eyeScale.toFixed(3)}x`)
  console.log(`   Nose: ${noseScale.toFixed(3)}x`)
  console.log(`   Mouth: ${mouthScale.toFixed(3)}x`)
  console.log(`   Hair: ${hairHeight.toFixed(3)}x height, ${hairWidth.toFixed(3)}x width, ${hairSpikiness.toFixed(3)} spikiness`)
  
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
            // Apply hair styling to the simple top arc
            newX = x * hairWidth * faceWidthScale  // Scale with face width
            
            // TOP ARC - the crown/main hair volume
            // Apply height/volume/spikiness
            if (y > 0.50) {
              // Upper part (crown) - main styling area
              const distanceFromBase = y - 0.50
              newY = 0.50 + (distanceFromBase * hairHeight) + (hairSpikiness * 0.20)
              
              // Add width variation at top for volume
              const heightFactor = (y - 0.50) / 0.24  // 0 at base, 1 at top
              newX = newX * (1 + (hairWidth - 1) * heightFactor * 0.5)
            } else {
              // Temple connection points (base) - minimal scaling
              newY = y
              newX = newX * hairWidth
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


/**
 * Convert MediaPipe Face Mesh landmarks (468 points) to our 28 custom 3D contours
 * MediaPipe gives us normalized coordinates [0-1] with Z depth
 */

export interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

/**
 * Map MediaPipe's 468 landmarks to our 28 contours
 * Key MediaPipe indices (0-based):
 * - Face oval: 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
 * - Lips: 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291 (outer), 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308 (inner)
 * - Left eye: 33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7
 * - Right eye: 362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382
 * - Eyebrows: 70, 63, 105, 66, 107, 55, 65, 52, 53, 46 (left), 300, 293, 334, 296, 336, 285, 295, 282, 283, 276 (right)
 * - Nose: 1, 2, 98, 327 (bridge), 168 (tip), 6, 197, 195, 5 (nostril area)
 */
export function mediapipeToContours(landmarks: any[]): FaceContour[] {
  // Normalize coordinates: MediaPipe gives [0,1] range, we want [-1, 1] centered
  // NOTE: MediaPipe Y is inverted (0 = top, 1 = bottom), so we flip it
  const normalize = (lm: any): [number, number, number] => {
    return [
      (lm.x - 0.5) * 2,      // Convert [0,1] to [-1,1] (left to right)
      -(lm.y - 0.5) * 2,     // Convert [0,1] to [1,-1] (FLIPPED: top to bottom)
      lm.z * 2               // Z is already roughly centered, just scale
    ]
  }

  const getLandmark = (idx: number) => {
    if (idx >= landmarks.length) {
      console.warn(`Landmark ${idx} out of range (max: ${landmarks.length - 1})`)
      return [0, 0, 0] as [number, number, number]
    }
    return normalize(landmarks[idx])
  }
  const getLandmarks = (indices: number[]) => indices.map(i => getLandmark(i))

  return [
    // 1. Jawline - critical for face shape
    {
      name: 'jawline',
      points: getLandmarks([234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152]),
      connects_to: ['chin', 'left_cheek', 'right_cheek']
    },
    
    // 2. Chin
    {
      name: 'chin',
      points: getLandmarks([152, 377, 400, 378, 379, 365, 397, 288, 361]),
      connects_to: ['jawline', 'neck_base']
    },

    // 3-4. Cheeks
    {
      name: 'left_cheek',
      points: getLandmarks([234, 127, 162, 21, 54, 103, 67, 109]),
      connects_to: ['jawline', 'left_eye_outline']
    },
    {
      name: 'right_cheek',
      points: getLandmarks([454, 356, 389, 251, 284, 332, 297, 338]),
      connects_to: ['jawline', 'right_eye_outline']
    },

    // 5-6. Eyes
    {
      name: 'left_eye_outline',
      points: getLandmarks([33, 246, 161, 160, 159, 158, 157, 173]),
      connects_to: ['left_cheek', 'left_eyebrow']
    },
    {
      name: 'right_eye_outline',
      points: getLandmarks([362, 398, 384, 385, 386, 387, 388, 466]),
      connects_to: ['right_cheek', 'right_eyebrow']
    },

    // 7-8. Eye details (pupils at eye center)
    {
      name: 'left_eye_pupil',
      points: [33, 33, 33, 33, 33].map(() => getLandmark(33)), // Use left eye center
      connects_to: ['left_eye_outline']
    },
    {
      name: 'right_eye_pupil',
      points: [263, 263, 263, 263, 263].map(() => getLandmark(263)), // Use right eye center
      connects_to: ['right_eye_outline']
    },

    // 9-10. Eyebrows
    {
      name: 'left_eyebrow',
      points: getLandmarks([70, 63, 105, 66, 107]),
      connects_to: ['left_eye_outline', 'forehead']
    },
    {
      name: 'right_eyebrow',
      points: getLandmarks([300, 293, 334, 296, 336]),
      connects_to: ['right_eye_outline', 'forehead']
    },

    // 11. Forehead
    {
      name: 'forehead',
      points: getLandmarks([10, 338, 297, 332, 284, 251]),
      connects_to: ['left_eyebrow', 'right_eyebrow', 'hairline']
    },

    // 12-15. Hairline (estimated from forehead + sides)
    {
      name: 'hairline_front',
      points: getLandmarks([10, 338, 297, 332, 284, 251]).map(([x, y, z]) => [x, y - 0.3, z] as [number, number, number]),
      connects_to: ['forehead', 'hairline_left', 'hairline_right']
    },
    {
      name: 'hairline_left',
      points: getLandmarks([234, 127, 162]).map(([x, y, z]) => [x - 0.15, y - 0.2, z] as [number, number, number]),
      connects_to: ['hairline_front', 'left_hair_side']
    },
    {
      name: 'hairline_right',
      points: getLandmarks([454, 356, 389]).map(([x, y, z]) => [x + 0.15, y - 0.2, z] as [number, number, number]),
      connects_to: ['hairline_front', 'right_hair_side']
    },
    {
      name: 'hair_top',
      points: getLandmarks([10]).map(([x, y, z]) => [x, y - 0.4, z] as [number, number, number]),
      connects_to: ['hairline_front']
    },

    // 16-17. Hair sides
    {
      name: 'left_hair_side',
      points: getLandmarks([234, 93, 132, 58]).map(([x, y, z]) => [x - 0.1, y, z] as [number, number, number]),
      connects_to: ['hairline_left', 'left_ear']
    },
    {
      name: 'right_hair_side',
      points: getLandmarks([454, 323, 361, 288]).map(([x, y, z]) => [x + 0.1, y, z] as [number, number, number]),
      connects_to: ['hairline_right', 'right_ear']
    },

    // 18-19. Ears (estimated from face sides)
    {
      name: 'left_ear',
      points: getLandmarks([234, 127, 162]).map(([x, y, z]) => [x - 0.2, y, z - 0.1] as [number, number, number]),
      connects_to: ['left_hair_side', 'jawline']
    },
    {
      name: 'right_ear',
      points: getLandmarks([454, 356, 389]).map(([x, y, z]) => [x + 0.2, y, z - 0.1] as [number, number, number]),
      connects_to: ['right_hair_side', 'jawline']
    },

    // 20-22. Nose
    {
      name: 'nose_bridge',
      points: getLandmarks([6, 197, 195, 5]),
      connects_to: ['nose_tip', 'forehead']
    },
    {
      name: 'nose_tip',
      points: getLandmarks([4, 5, 195, 197]),
      connects_to: ['nose_bridge', 'nose_nostrils']
    },
    {
      name: 'nose_nostrils',
      points: getLandmarks([98, 97, 2, 326, 327]),
      connects_to: ['nose_tip', 'mouth_outline']
    },

    // 23-24. Mouth
    {
      name: 'mouth_outline',
      points: getLandmarks([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]),
      connects_to: ['chin', 'nose_nostrils']
    },
    {
      name: 'mouth_inner',
      points: getLandmarks([78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]),
      connects_to: ['mouth_outline']
    },

    // 25-27. Neck
    {
      name: 'neck_base',
      points: getLandmarks([152, 148, 176]).map(([x, y, z]) => [x, y + 0.4, z * 0.8] as [number, number, number]),
      connects_to: ['chin']
    },
    {
      name: 'neck_left',
      points: getLandmarks([234, 93]).map(([x, y, z]) => [x, y + 0.3, z * 0.7] as [number, number, number]),
      connects_to: ['jawline', 'neck_base']
    },
    {
      name: 'neck_right',
      points: getLandmarks([454, 323]).map(([x, y, z]) => [x, y + 0.3, z * 0.7] as [number, number, number]),
      connects_to: ['jawline', 'neck_base']
    },

    // 28. Back of head (estimated)
    {
      name: 'head_back',
      points: getLandmarks([10]).map(([x, y, z]) => [x, y - 0.3, z - 0.5] as [number, number, number]),
      connects_to: ['hair_top', 'left_ear', 'right_ear']
    }
  ]
}


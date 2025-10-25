import { NextResponse } from 'next/server'

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

function generateMockFaceContours(): FaceContour[] {
  // Full 3D head: face + hair + back scaffold (with MUCH more depth)
  return [
    // FRONT FACE (detailed, with proper depth)
    {
      name: 'jawline',
      points: [
        [-0.5, -0.35, 0.08], [-0.48, -0.5, 0.12], [-0.42, -0.58, 0.14],
        [-0.32, -0.63, 0.16], [-0.18, -0.66, 0.18], [0, -0.68, 0.19],
        [0.18, -0.66, 0.18], [0.32, -0.63, 0.16], [0.42, -0.58, 0.14],
        [0.48, -0.5, 0.12], [0.5, -0.35, 0.08]
      ],
      connects_to: ['left_cheek', 'chin', 'right_cheek', 'left_temple', 'right_temple']
    },
    {
      name: 'left_cheek',
      points: [
        [-0.5, -0.28, 0.08], [-0.56, -0.18, 0.2], [-0.6, -0.06, 0.25],
        [-0.58, 0.06, 0.26], [-0.54, 0.17, 0.24], [-0.48, 0.25, 0.2]
      ],
      connects_to: ['jawline', 'left_eye_outline', 'nose_bridge', 'left_temple']
    },
    {
      name: 'right_cheek',
      points: [
        [0.5, -0.28, 0.08], [0.56, -0.18, 0.2], [0.6, -0.06, 0.25],
        [0.58, 0.06, 0.26], [0.54, 0.17, 0.24], [0.48, 0.25, 0.2]
      ],
      connects_to: ['jawline', 'right_eye_outline', 'nose_bridge', 'right_temple']
    },
    {
      name: 'forehead',
      points: [
        [-0.45, 0.42, 0.18], [-0.33, 0.52, 0.2], [-0.18, 0.58, 0.21],
        [0, 0.6, 0.22], [0.18, 0.58, 0.21], [0.33, 0.52, 0.2], [0.45, 0.42, 0.18]
      ],
      connects_to: ['left_eyebrow', 'right_eyebrow', 'top_of_head']
    },
    {
      name: 'left_eye_outline',
      points: [
        [-0.35, 0.28, 0.28], [-0.29, 0.32, 0.32], [-0.22, 0.33, 0.34],
        [-0.15, 0.32, 0.33], [-0.12, 0.28, 0.31], [-0.14, 0.24, 0.29],
        [-0.2, 0.23, 0.28], [-0.27, 0.24, 0.28], [-0.33, 0.26, 0.29]
      ],
      connects_to: ['left_eyebrow', 'nose_bridge', 'left_cheek']
    },
    {
      name: 'right_eye_outline',
      points: [
        [0.12, 0.28, 0.31], [0.15, 0.32, 0.33], [0.22, 0.33, 0.34],
        [0.29, 0.32, 0.32], [0.35, 0.28, 0.28], [0.33, 0.26, 0.29],
        [0.27, 0.24, 0.28], [0.2, 0.23, 0.28], [0.14, 0.24, 0.29]
      ],
      connects_to: ['right_eyebrow', 'nose_bridge', 'right_cheek']
    },
    {
      name: 'nose_bridge',
      points: [
        [0, 0.18, 0.38], [0, 0.1, 0.42], [0, 0.02, 0.45],
        [0, -0.05, 0.47], [0, -0.1, 0.48]
      ],
      connects_to: ['left_eye_outline', 'right_eye_outline', 'nose_tip']
    },
    {
      name: 'nose_tip',
      points: [
        [-0.1, -0.12, 0.46], [-0.06, -0.14, 0.48], [0, -0.15, 0.5],
        [0.06, -0.14, 0.48], [0.1, -0.12, 0.46]
      ],
      connects_to: ['nose_bridge', 'mouth_outline']
    },
    {
      name: 'mouth_outline',
      points: [
        [-0.28, -0.38, 0.35], [-0.2, -0.42, 0.38], [-0.1, -0.44, 0.39],
        [0, -0.45, 0.4], [0.1, -0.44, 0.39], [0.2, -0.42, 0.38],
        [0.28, -0.38, 0.35], [0.22, -0.34, 0.37], [0.12, -0.32, 0.38],
        [0, -0.31, 0.39], [-0.12, -0.32, 0.38], [-0.22, -0.34, 0.37]
      ],
      connects_to: ['nose_tip', 'chin', 'left_cheek', 'right_cheek']
    },
    {
      name: 'left_eyebrow',
      points: [
        [-0.38, 0.4, 0.28], [-0.32, 0.44, 0.3], [-0.25, 0.46, 0.31],
        [-0.18, 0.45, 0.31], [-0.12, 0.42, 0.3], [-0.08, 0.38, 0.29]
      ],
      connects_to: ['forehead', 'left_eye_outline']
    },
    {
      name: 'right_eyebrow',
      points: [
        [0.08, 0.38, 0.29], [0.12, 0.42, 0.3], [0.18, 0.45, 0.31],
        [0.25, 0.46, 0.31], [0.32, 0.44, 0.3], [0.38, 0.4, 0.28]
      ],
      connects_to: ['forehead', 'right_eye_outline']
    },
    {
      name: 'chin',
      points: [
        [-0.15, -0.66, 0.18], [-0.08, -0.69, 0.19], [0, -0.7, 0.2],
        [0.08, -0.69, 0.19], [0.15, -0.66, 0.18]
      ],
      connects_to: ['jawline', 'mouth_outline']
    },
    
    // HAIR - Cohesive shape with natural waves/flow
    // Front hairline with wavy texture (main visible hair)
    {
      name: 'hair_front',
      points: [
        [-0.5, 0.5, 0.18],   // Left temple start
        [-0.42, 0.55, 0.2],  // Wave peak 1
        [-0.32, 0.58, 0.21], // Wave dip 1
        [-0.22, 0.61, 0.22], // Wave peak 2
        [-0.12, 0.62, 0.23], // Center dip
        [0, 0.63, 0.23],     // Center
        [0.12, 0.62, 0.23],  // Center dip
        [0.22, 0.61, 0.22],  // Wave peak 3
        [0.32, 0.58, 0.21],  // Wave dip 2
        [0.42, 0.55, 0.2],   // Wave peak 4
        [0.5, 0.5, 0.18]     // Right temple start
      ],
      connects_to: ['forehead', 'hair_left_side', 'hair_right_side']
    },
    // Left side flowing hair (wavy curtain)
    {
      name: 'hair_left_side',
      points: [
        [-0.5, 0.5, 0.18],    // Temple
        [-0.55, 0.4, 0.13],   // Wave out
        [-0.58, 0.3, 0.08],   // Wave in
        [-0.62, 0.18, 0.02],  // Wave out
        [-0.64, 0.05, -0.04], // Wave in
        [-0.65, -0.08, -0.08],// Wave out
        [-0.64, -0.2, -0.12], // Wave in (ends near ear)
        [-0.62, -0.32, -0.14] // End
      ],
      connects_to: ['hair_front', 'jawline']
    },
    // Right side flowing hair (wavy curtain)
    {
      name: 'hair_right_side',
      points: [
        [0.5, 0.5, 0.18],     // Temple
        [0.55, 0.4, 0.13],    // Wave out
        [0.58, 0.3, 0.08],    // Wave in
        [0.62, 0.18, 0.02],   // Wave out
        [0.64, 0.05, -0.04],  // Wave in
        [0.65, -0.08, -0.08], // Wave out
        [0.64, -0.2, -0.12],  // Wave in
        [0.62, -0.32, -0.14]  // End
      ],
      connects_to: ['hair_front', 'jawline']
    },
    // Top of head hair volume (wavy)
    {
      name: 'hair_top',
      points: [
        [-0.45, 0.65, 0.12],  // Left peak
        [-0.32, 0.72, 0.06],  // Dip
        [-0.18, 0.78, 0.0],   // Peak
        [-0.05, 0.81, -0.03], // Dip
        [0, 0.82, -0.05],     // Center highest
        [0.05, 0.81, -0.03],  // Dip
        [0.18, 0.78, 0.0],    // Peak
        [0.32, 0.72, 0.06],   // Dip
        [0.45, 0.65, 0.12]    // Right peak
      ],
      connects_to: ['hair_front', 'forehead']
    },
    // Inner hair layer (adds volume/thickness - closer to face)
    {
      name: 'hair_inner',
      points: [
        [-0.44, 0.48, 0.22],  // Left
        [-0.3, 0.52, 0.24],   // Wave
        [-0.15, 0.54, 0.25],  // Wave
        [0, 0.55, 0.26],      // Center
        [0.15, 0.54, 0.25],   // Wave
        [0.3, 0.52, 0.24],    // Wave
        [0.44, 0.48, 0.22]    // Right
      ],
      connects_to: ['hair_front', 'forehead']
    },
    
    // NECK (minimal - just front connection)
    {
      name: 'neck_front',
      points: [
        [-0.22, -0.7, 0.16], [-0.15, -0.76, 0.17], [-0.08, -0.8, 0.18],
        [0, -0.82, 0.18], [0.08, -0.8, 0.18], [0.15, -0.76, 0.17],
        [0.22, -0.7, 0.16]
      ],
      connects_to: ['chin', 'jawline']
    }
  ]
}

/**
 * GET /api/mock-face
 * Returns the base mock face template
 */
export async function GET() {
  return NextResponse.json({ 
    contours: generateMockFaceContours() 
  })
}


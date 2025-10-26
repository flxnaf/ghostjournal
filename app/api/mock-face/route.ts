import { NextResponse } from 'next/server'

interface FaceContour {
  name: string
  points: [number, number, number][]
  connects_to: string[]
}

/**
 * Generate a parabolic curve for hair (flows naturally)
 * @param xStart - Left x position
 * @param xEnd - Right x position
 * @param yBase - Base y position (bottom of curve)
 * @param yPeak - Peak y position (top of curve at center)
 * @param zDepth - Z depth
 * @param numPoints - Number of points along curve
 */
function generateHairCurve(
  xStart: number,
  xEnd: number,
  yBase: number,
  yPeak: number,
  zDepth: number,
  numPoints: number
): [number, number, number][] {
  const points: [number, number, number][] = []
  const width = xEnd - xStart
  const height = yPeak - yBase
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)  // 0 to 1
    const x = xStart + width * t
    
    // Parabolic curve: y = -4*height*(t - 0.5)^2 + yPeak
    // This creates a smooth arc that peaks in the middle
    const parabola = -4 * height * Math.pow(t - 0.5, 2) + height
    const y = yBase + parabola
    
    points.push([x, y, zDepth])
  }
  
  return points
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
    
    // HAIR - Simple arc over the head (front-facing view)
    // Just the crown/top - no side sections to avoid overlapping face
    {
      name: 'hair_top',
      points: [
        [-0.48, 0.38, 0.18],  // Left temple (start visible)
        [-0.45, 0.50, 0.20],  // Curve upward
        [-0.38, 0.60, 0.21],
        [-0.28, 0.68, 0.22],
        [-0.15, 0.72, 0.22],
        [0, 0.74, 0.22],      // Crown peak
        [0.15, 0.72, 0.22],
        [0.28, 0.68, 0.22],
        [0.38, 0.60, 0.21],
        [0.45, 0.50, 0.20],   // Curve downward
        [0.48, 0.38, 0.18]    // Right temple (end visible)
      ],
      connects_to: ['forehead']
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


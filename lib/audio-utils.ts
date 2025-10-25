/**
 * Audio utilities for waveform analysis and processing
 */

export function normalizeAudioData(dataArray: Uint8Array): number[] {
  return Array.from(dataArray).map(val => val / 255)
}

export function getAudioAmplitude(dataArray: Uint8Array): number {
  const sum = Array.from(dataArray).reduce((a, b) => a + b, 0)
  return sum / dataArray.length / 255
}

export function smoothAudioData(dataArray: number[], smoothing: number = 0.8): number[] {
  const smoothed: number[] = []
  let prev = dataArray[0] || 0
  
  for (let i = 0; i < dataArray.length; i++) {
    const smoothedValue = prev * smoothing + dataArray[i] * (1 - smoothing)
    smoothed.push(smoothedValue)
    prev = smoothedValue
  }
  
  return smoothed
}

export async function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

export function setupAudioAnalyser(
  audioContext: AudioContext,
  source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode,
  fftSize: number = 256
): AnalyserNode {
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = fftSize
  analyser.smoothingTimeConstant = 0.8
  source.connect(analyser)
  return analyser
}


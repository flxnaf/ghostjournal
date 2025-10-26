/**
 * Supabase Storage Utilities
 * Handles file uploads for audio recordings and photos
 */

import { createClient } from './supabase'

export const STORAGE_BUCKETS = {
  AUDIO: 'audio-recordings',
  PHOTOS: 'user-photos',
} as const

/**
 * Upload audio file to Supabase Storage
 * @param userId - User's UUID from Supabase auth
 * @param audioFile - Audio file blob
 * @returns Public URL of uploaded file
 */
export async function uploadAudio(userId: string, audioFile: Blob): Promise<string> {
  const supabase = createClient()

  const fileName = `${userId}/recording-${Date.now()}.webm`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .upload(fileName, audioFile, {
      contentType: 'audio/webm',
      upsert: true,
    })

  if (error) {
    console.error('❌ Supabase Storage error:', error)
    throw new Error(`Failed to upload audio: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Fallback: Upload audio to local filesystem (for development/Railway)
 */
async function uploadAudioLocal(userId: string, audioFile: Blob): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  
  const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
  const fileName = `recording-${Date.now()}.webm`
  const filePath = join(uploadDir, fileName)
  
  // Create directory if it doesn't exist
  await mkdir(uploadDir, { recursive: true })
  
  // Convert Blob to Buffer
  const arrayBuffer = await audioFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Write file
  await writeFile(filePath, buffer)
  
  // Return relative URL
  return `/uploads/${userId}/${fileName}`
}

/**
 * Upload photo to Supabase Storage
 * @param userId - User's UUID from Supabase auth
 * @param photoFile - Photo file blob
 * @param index - Photo index (for multiple photos)
 * @returns Public URL of uploaded file
 */
export async function uploadPhoto(
  userId: string,
  photoFile: Blob,
  index: number
): Promise<string> {
  const supabase = createClient()

  const fileName = `${userId}/photo-${index}-${Date.now()}.jpg`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PHOTOS)
    .upload(fileName, photoFile, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) {
    console.error('❌ Supabase Storage error:', error)
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.PHOTOS)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Fallback: Upload photo to local filesystem
 */
async function uploadPhotoLocal(userId: string, photoFile: Blob, index: number): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  
  const uploadDir = join(process.cwd(), 'public', 'uploads', userId)
  const fileName = `photo-${index}-${Date.now()}.jpg`
  const filePath = join(uploadDir, fileName)
  
  // Create directory if it doesn't exist
  await mkdir(uploadDir, { recursive: true })
  
  // Convert Blob to Buffer
  const arrayBuffer = await photoFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  // Write file
  await writeFile(filePath, buffer)
  
  // Return relative URL
  return `/uploads/${userId}/${fileName}`
}

/**
 * Upload multiple photos to Supabase Storage
 * @param userId - User's UUID from Supabase auth
 * @param photoFiles - Array of photo file blobs
 * @returns Array of public URLs
 */
export async function uploadPhotos(
  userId: string,
  photoFiles: Blob[]
): Promise<string[]> {
  const uploadPromises = photoFiles.map((file, index) =>
    uploadPhoto(userId, file, index)
  )

  return Promise.all(uploadPromises)
}

/**
 * Delete audio file from Supabase Storage
 * @param userId - User's UUID from Supabase auth
 */
export async function deleteAudio(userId: string): Promise<void> {
  const supabase = createClient()

  // List all audio files for this user
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .list(userId)

  if (listError) {
    console.error('Error listing audio files:', listError)
    return
  }

  if (!files || files.length === 0) return

  // Delete all files
  const filePaths = files.map(file => `${userId}/${file.name}`)
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.AUDIO)
    .remove(filePaths)

  if (error) {
    console.error('Error deleting audio files:', error)
  }
}

/**
 * Delete photos from Supabase Storage
 * @param userId - User's UUID from Supabase auth
 */
export async function deletePhotos(userId: string): Promise<void> {
  const supabase = createClient()

  // List all photo files for this user
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.PHOTOS)
    .list(userId)

  if (listError) {
    console.error('Error listing photo files:', listError)
    return
  }

  if (!files || files.length === 0) return

  // Delete all files
  const filePaths = files.map(file => `${userId}/${file.name}`)
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.PHOTOS)
    .remove(filePaths)

  if (error) {
    console.error('Error deleting photo files:', error)
  }
}

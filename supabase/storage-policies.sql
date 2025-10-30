-- =====================================================
-- Supabase Storage Policies for GhostJournal
-- =====================================================
-- Run this AFTER creating the storage buckets via Dashboard UI
--
-- Prerequisites:
-- 1. Create bucket: audio-recordings (public ✅)
-- 2. Create bucket: user-photos (public ✅)
--
-- What this does:
-- - Allows users to upload only to their own folders
-- - Allows users to delete only their own files
-- - Allows public read access for all files
-- =====================================================

-- =====================================================
-- AUDIO RECORDINGS BUCKET POLICIES
-- =====================================================

-- Policy: Anyone can view audio files (public bucket)
CREATE POLICY "Public Access - View audio recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');

-- Policy: Authenticated users can upload audio to their own folder
CREATE POLICY "Authenticated Users - Upload own audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own audio files
CREATE POLICY "Users - Update own audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio-recordings'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own audio files
CREATE POLICY "Users - Delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio-recordings'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- USER PHOTOS BUCKET POLICIES
-- =====================================================

-- Policy: Anyone can view photos (public bucket)
CREATE POLICY "Public Access - View user photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- Policy: Authenticated users can upload photos to their own folder
CREATE POLICY "Authenticated Users - Upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own photos
CREATE POLICY "Users - Update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users - Delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- EXPLANATION
-- =====================================================
--
-- File Structure in Buckets:
-- audio-recordings/
--   └── {userId}/
--       └── recording-{timestamp}.webm
--
-- user-photos/
--   └── {userId}/
--       ├── photo-0-{timestamp}.jpg
--       ├── photo-1-{timestamp}.jpg
--       └── ...
--
-- Security:
-- - (storage.foldername(name))[1] extracts the first folder (userId)
-- - auth.uid()::text gets the current user's ID
-- - This ensures users can only upload/delete in their own folder
--
-- Public Access:
-- - All files are publicly readable (needed for avatar display)
-- - But only the owner can upload/modify/delete
-- =====================================================

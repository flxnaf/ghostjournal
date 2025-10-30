-- =====================================================
-- FIX: Drop and Recreate Storage Policies
-- =====================================================
-- Run this if you're getting RLS errors or if policies
-- were created incorrectly
--
-- This will:
-- 1. Drop all existing policies (if any)
-- 2. Create fresh, working policies
-- =====================================================

-- =====================================================
-- STEP 1: Drop Existing Policies (ignore errors if they don't exist)
-- =====================================================

-- Drop audio-recordings policies
DROP POLICY IF EXISTS "Public Access - View audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users - Upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users - Update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users - Delete own audio" ON storage.objects;

-- Drop user-photos policies
DROP POLICY IF EXISTS "Public Access - View user photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users - Upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users - Update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users - Delete own photos" ON storage.objects;

-- =====================================================
-- STEP 2: Create Fresh Policies
-- =====================================================

-- =====================================================
-- AUDIO RECORDINGS BUCKET
-- =====================================================

-- Allow anyone to read/download audio files
CREATE POLICY "Public Access - View audio recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-recordings');

-- Allow authenticated users to upload audio to their own folder
CREATE POLICY "Authenticated Users - Upload own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own audio files
CREATE POLICY "Users - Update own audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own audio files
CREATE POLICY "Users - Delete own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- USER PHOTOS BUCKET
-- =====================================================

-- Allow anyone to read/download photos
CREATE POLICY "Public Access - View user photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Authenticated Users - Upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users - Update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users - Delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify policies were created:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE tablename = 'objects'
-- ORDER BY policyname;
--
-- You should see 8 policies total (4 per bucket)
-- =====================================================

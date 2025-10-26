-- =====================================================
-- DISABLE RLS ON STORAGE (DEVELOPMENT ONLY)
-- =====================================================
-- ⚠️ WARNING: Only use this for local development!
-- This disables Row Level Security on storage.objects
-- which means ANYONE can upload/delete files.
--
-- DO NOT USE IN PRODUCTION!
-- =====================================================

-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verification query (should show rowsecurity = false)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- =====================================================
-- TO RE-ENABLE RLS LATER (for production):
--
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- Then run storage-policies-fix.sql to add proper policies
-- =====================================================

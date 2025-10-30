-- =====================================================
-- ENABLE RLS ON STORAGE (PRODUCTION)
-- =====================================================
-- Use this when you're ready to deploy to production
-- This enables Row Level Security on storage.objects
-- and creates proper security policies
-- =====================================================

-- Step 1: Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies (same as storage-policies-fix.sql)
-- Run storage-policies-fix.sql after running this

-- Verification query (should show rowsecurity = true)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- =====================================================
-- NEXT STEPS:
-- After running this, run: storage-policies-fix.sql
-- to create the security policies
-- =====================================================

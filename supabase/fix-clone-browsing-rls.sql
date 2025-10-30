-- =====================================================
-- FIX RLS FOR CLONE BROWSING
-- =====================================================
-- This allows users to read other users' public clones
-- while still protecting private data
-- =====================================================

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('User', 'Memory', 'Conversation');

-- Option 1: DISABLE RLS (Quick fix for development)
-- ⚠️ WARNING: This disables all security on these tables
-- Only use for local development!

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Memory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Option 2: ENABLE RLS WITH PROPER POLICIES (Recommended)
-- =====================================================
-- Uncomment the section below to use secure policies instead
--
-- -- Enable RLS
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Memory" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
--
-- -- User table policies
-- -- Allow reading public users (for clone browsing)
-- CREATE POLICY "Public users are viewable by everyone"
--   ON "User"
--   FOR SELECT
--   USING ("isPublic" = true);
--
-- -- Allow users to view their own data (including private)
-- CREATE POLICY "Users can view own data"
--   ON "User"
--   FOR SELECT
--   USING (auth.uid()::text = id);
--
-- -- Allow users to update their own data
-- CREATE POLICY "Users can update own data"
--   ON "User"
--   FOR UPDATE
--   USING (auth.uid()::text = id);
--
-- -- Memory table policies
-- -- Allow reading memories of public users
-- CREATE POLICY "Memories of public users are viewable"
--   ON "Memory"
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM "User"
--       WHERE "User".id = "Memory"."userId"
--       AND "User"."isPublic" = true
--     )
--   );
--
-- -- Allow users to view their own memories
-- CREATE POLICY "Users can view own memories"
--   ON "Memory"
--   FOR SELECT
--   USING (auth.uid()::text = "userId");
--
-- -- Allow users to manage their own memories
-- CREATE POLICY "Users can manage own memories"
--   ON "Memory"
--   FOR ALL
--   USING (auth.uid()::text = "userId");
--
-- -- Conversation table policies
-- -- Allow users to view their own conversations
-- CREATE POLICY "Users can view own conversations"
--   ON "Conversation"
--   FOR SELECT
--   USING (auth.uid()::text = "userId");
--
-- -- Allow users to manage their own conversations
-- CREATE POLICY "Users can manage own conversations"
--   ON "Conversation"
--   FOR ALL
--   USING (auth.uid()::text = "userId");
--
-- =====================================================

-- Verify RLS is disabled (for Option 1)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('User', 'Memory', 'Conversation');


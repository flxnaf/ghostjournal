# Fix for Clone Browsing Error

## ❌ Error You're Seeing

When trying to chat with another user's public clone, you get:
```
You must be authenticated to use this endpoint. Either log in or provide a valid API key.
```

## 🔍 Root Cause

Supabase Row Level Security (RLS) is enabled on the `User`, `Memory`, and `Conversation` tables. This blocks API routes from reading other users' data, even for public clones.

## ✅ Quick Fix (Development)

### Step 1: Disable RLS

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Memory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" DISABLE ROW LEVEL SECURITY;
```

4. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify

Run this query to check RLS is disabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('User', 'Memory', 'Conversation');
```

All three should show `rowsecurity = false`.

### Step 3: Test

1. Go back to your app
2. Click "Browse Clones"
3. Select a public clone
4. Send a message "Hi!"
5. Should work now! ✅

---

## 🔒 Proper Fix (Production)

For production, you should use RLS policies instead of disabling RLS entirely.

### Step 1: Enable RLS with Policies

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the contents of `fix-clone-browsing-rls.sql` 
3. Uncomment the "Option 2" section (the policies)
4. Run the query

### What This Does:

**User Table:**
- ✅ Everyone can read public users (`isPublic = true`)
- ✅ Users can read their own data (public or private)
- ✅ Users can update only their own data

**Memory Table:**
- ✅ Everyone can read memories of public users
- ✅ Users can read their own memories (even if not public)
- ✅ Users can only modify their own memories

**Conversation Table:**
- ✅ Users can only read/modify their own conversations
- ❌ Conversations are always private (not shared with clone browsers)

---

## 🚀 API Route Alternative

Another option is to use the **Supabase Service Role Key** in API routes to bypass RLS:

In `/app/api/speak/route.ts`, replace the Prisma client with a Supabase admin client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Use supabase client instead of prisma
const { data: user } = await supabase
  .from('User')
  .select('*')
  .eq('id', userId)
  .single()
```

This approach:
- ✅ Keeps RLS enabled for frontend queries
- ✅ Allows API routes to read any data (using service role key)
- ✅ More secure than disabling RLS globally

---

## 📝 Summary

| Scenario | Solution | Time |
|----------|----------|------|
| Local dev, quick fix | Disable RLS | 30 seconds |
| Production, secure | Enable RLS with policies | 2 minutes |
| API-only access | Use service role key in API | 5 minutes |

For now, **use the Quick Fix** (disable RLS) to unblock yourself, then implement the proper fix before deploying to production.

---

## 🐛 Troubleshooting

### Still getting the error?

1. **Check environment variables:**
   - Make sure `DATABASE_URL` points to your Supabase database
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are set

2. **Clear browser cache:**
   - Sometimes old auth tokens cause issues
   - Try logging out and back in

3. **Check Supabase logs:**
   - Go to **Logs** → **Postgres Logs** in Supabase Dashboard
   - Look for RLS errors with more context

4. **Verify user exists:**
   ```sql
   SELECT id, name, username, "isPublic" FROM "User" LIMIT 5;
   ```
   - Make sure the user you're trying to chat with exists and has `isPublic = true`


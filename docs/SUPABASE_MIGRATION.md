# Supabase Migration Guide

## Current Temporary Auth System

The app currently uses `localStorage` for authentication (see `lib/hooks/useAuth.ts`). This is **NOT secure** and should be replaced with Supabase.

## What Needs to Be Migrated

### 1. Authentication (`lib/hooks/useAuth.ts`)

**Current (Temporary):**
- Login/signup stored in `localStorage`
- Passwords stored in plain text (insecure!)
- No email verification
- No password reset

**Replace with Supabase:**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// Signup
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name: name
    }
  }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Logout
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### 2. Database Schema

**Tables to create in Supabase:**

#### `users` (extends auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### `clones` (AI clone data)
```sql
CREATE TABLE public.clones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Voice data
  voice_model_id TEXT,
  audio_url TEXT,
  
  -- Face data
  face_contours JSONB,
  photo_urls TEXT[],
  
  -- Personality data
  personality_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One clone per user
  UNIQUE(user_id)
);

ALTER TABLE public.clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clone" ON public.clones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clone" ON public.clones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clone" ON public.clones
  FOR UPDATE USING (auth.uid() = user_id);
```

#### `conversations` (chat history)
```sql
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### `memories` (context/personality data)
```sql
CREATE TABLE public.memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'story', 'habit', 'reaction'
  embedding TEXT, -- For vector search (can upgrade to pgvector later)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_memories_category ON public.memories(category);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. File Storage

**Current:** Files stored in `public/uploads/`

**Migrate to Supabase Storage:**
```typescript
// Create buckets in Supabase dashboard:
// - 'audio-recordings' (private)
// - 'photos' (private)
// - 'generated-audio' (private)

// Upload audio
const { data, error } = await supabase.storage
  .from('audio-recordings')
  .upload(`${userId}/recording.webm`, audioFile)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('audio-recordings')
  .getPublicUrl(`${userId}/recording.webm`)
```

### 4. API Route Updates

All API routes need to:
1. Get user from Supabase session instead of request body
2. Use RLS policies for data access

**Example: `/api/speak/route.ts`**

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Now use user.id instead of accepting userId from request body
  const userId = user.id
  
  // ... rest of API logic
}
```

## Migration Steps

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`

2. **Install Supabase**
   ```bash
   npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
   ```

3. **Add Environment Variables** (`.env.local`)
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run SQL Scripts** (in Supabase SQL Editor)
   - Create all tables from above

5. **Update Auth Hook** (`lib/hooks/useAuth.ts`)
   - Replace localStorage logic with Supabase auth
   - Keep the same interface for minimal changes

6. **Update API Routes**
   - Add Supabase client to each route
   - Get user from session instead of request body
   - Use Supabase queries instead of Prisma (or keep Prisma and sync)

7. **Migrate Existing Data** (if any)
   - Export from localStorage/Prisma
   - Import to Supabase tables

8. **Test Everything**
   - Signup/login flow
   - Clone creation
   - Chat with clone
   - Data persistence

## Resources

- [Supabase Next.js Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## Notes

- The current `useAuth` hook interface is designed to be easily replaceable
- All API routes currently accept `userId` in request body - change to get from session
- Prisma can coexist with Supabase or be fully replaced
- Consider using Supabase pgvector for better memory/context search


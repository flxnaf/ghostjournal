# Supabase Setup Guide for GhostJournal

This guide will help you complete the Supabase migration for your GhostJournal app.

## What We've Implemented

✅ **Supabase Authentication** - Email/password login with session management
✅ **PostgreSQL Database** - Migrated from SQLite to Supabase PostgreSQL
✅ **Supabase Storage** - File uploads for audio and photos
✅ **User ID Sync** - Supabase auth users properly linked with app data
✅ **Middleware** - Automatic session refresh

## Setup Steps

### 1. Update Your .env File

Update your `.env` file with the Supabase PostgreSQL connection string:

```bash
# Get this from Supabase Dashboard > Settings > Database > Connection String
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ehxprwfkqnoxsvxljksz.supabase.co:5432/postgres"
```

**Where to find it:**
1. Go to your Supabase project dashboard
2. Settings → Database
3. Look for "Connection String" section
4. Copy the "URI" connection string (use Connection Pooling for production)
5. Replace `[YOUR-PASSWORD]` with your database password

### 2. Create Storage Buckets

You need to create two storage buckets in Supabase:

**Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Create these two buckets:

| Bucket Name | Public | Purpose |
|------------|--------|---------|
| `audio-recordings` | ✅ Yes | Store user voice recordings |
| `user-photos` | ✅ Yes | Store user face photos |

**Important:** Both buckets must be **public** so URLs work properly.

**Optional but Recommended:** Set up storage security policies by running the SQL script in `supabase/storage-policies.sql`. See `supabase/README.md` for detailed instructions.

### 3. Run Database Migration

Since we changed from SQLite to PostgreSQL, you need to run a migration:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Create tables in Supabase PostgreSQL
npx prisma db push
```

**What this does:**
- Creates the `User`, `Memory`, and `Conversation` tables in Supabase PostgreSQL
- Syncs your Prisma schema with the database

### 4. Test the Setup

Start your development server:

```bash
npm run dev
```

**Test checklist:**
- [ ] Sign up with a new account (creates Supabase auth user)
- [ ] Log out and log back in (session persistence)
- [ ] Record audio (uploads to Supabase Storage)
- [ ] Upload photos (uploads to Supabase Storage)
- [ ] Check Supabase Dashboard:
  - Authentication → Users (should see your user)
  - Database → User table (should have matching record)
  - Storage → Buckets (should see uploaded files)

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          Supabase Project               │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Authentication (auth.users)    │   │
│  │  - Email/password               │   │
│  │  - Session management           │   │
│  │  - User ID: UUID                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  PostgreSQL Database            │   │
│  │  - User (id matches auth UUID)  │   │
│  │  - Memory (user context)        │   │
│  │  - Conversation (chat history)  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Storage Buckets                │   │
│  │  - audio-recordings/            │   │
│  │  - user-photos/                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Key Changes Made

### Files Modified:
- `lib/supabase.ts` - Updated to use your custom env var name
- `components/LandingPage.tsx` - Removed "temporary auth" text
- `middleware.ts` - **NEW** - Auto session refresh
- `prisma/schema.prisma` - Changed to PostgreSQL + UUID
- `env.template` - Added PostgreSQL connection string
- `app/api/create-user/route.ts` - Syncs with Supabase auth
- `app/api/upload/route.ts` - Uses Supabase Storage

### Files Created:
- `lib/storage.ts` - Supabase Storage utilities
- `SUPABASE_SETUP.md` - This guide

## Data Flow

### User Signup/Login:
1. User enters email/password in `LandingPage.tsx`
2. `useAuth` hook calls Supabase auth API
3. Supabase creates user in `auth.users` table (UUID)
4. Session stored in cookies (managed by middleware)

### Audio Recording:
1. User records audio in `Recorder.tsx`
2. Audio sent to `/api/create-user`
3. API gets Supabase auth user ID
4. Creates/updates User record in PostgreSQL (same UUID)
5. Uploads audio to `audio-recordings` bucket
6. Stores Supabase Storage URL in User.audioUrl

### Photo Upload:
1. User uploads photos in `Uploader.tsx`
2. Photos sent to `/api/upload`
3. API uploads to `user-photos` bucket
4. Stores photo URLs in User.photoUrls

## Troubleshooting

### "Unauthorized" errors
- Make sure you're logged in
- Check that `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is set correctly
- Verify middleware is running (check browser console for session refresh)

### "Table does not exist" errors
- Run `npx prisma db push` to create tables
- Check that `DATABASE_URL` points to Supabase PostgreSQL

### "Bucket does not exist" errors
- Create the storage buckets in Supabase Dashboard
- Make sure they're named exactly: `audio-recordings` and `user-photos`
- Enable public access on both buckets

### Files not uploading
- Check bucket permissions (must be public)
- Verify Supabase URL and key are correct
- Check browser console for CORS errors

## Next Steps (Optional Enhancements)

Once everything is working, you can add:

1. **Password Reset** - Add "Forgot Password?" flow using Supabase's `resetPasswordForEmail()`
2. **Email Verification** - Require users to verify email before access
3. **OAuth Providers** - Add "Sign in with Google/GitHub" buttons
4. **Profile Management** - Let users update email/password
5. **Row Level Security (RLS)** - Add Supabase RLS policies to secure data access

## Questions?

If you encounter any issues:
1. Check Supabase Dashboard logs (Settings → Logs)
2. Check browser console for errors
3. Check server console for API errors
4. Verify all environment variables are set correctly

Good luck! 🚀

# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage buckets for GhostJournal.

## Step-by-Step Setup

### Step 1: Create Storage Buckets (via Dashboard UI)

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** (in the left sidebar)
3. Click **"New bucket"** button

#### Create Bucket 1: Audio Recordings
- **Bucket name:** `audio-recordings`
- **Public bucket:** ✅ **Check this box** (important!)
- Click **"Create bucket"**

#### Create Bucket 2: User Photos
- **Bucket name:** `user-photos`
- **Public bucket:** ✅ **Check this box** (important!)
- Click **"Create bucket"**

> **Why public?** These buckets need to be public so that:
> - Audio files can be played back in the browser
> - Photos can be displayed in the 3D avatar
> - However, upload/delete permissions are still protected by RLS policies

### Step 2: Set Up Storage Policies

Storage policies ensure users can only upload/delete files in their own folders.

#### Method 1: Fresh Setup (Recommended)
If this is your first time setting up policies:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy the contents of `storage-policies-fix.sql` (in this folder)
4. Paste into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`

#### Method 2: Quick Development Mode (Disable RLS)
If you're getting RLS errors and want to develop quickly:

1. Go to **SQL Editor**
2. Run the contents of `disable-rls-dev.sql`
3. ⚠️ **This is insecure** - only for local development!
4. Before production, run `enable-rls-prod.sql` then `storage-policies-fix.sql`

**What these policies do:**
- ✅ Anyone can **view/download** files (public read)
- ✅ Authenticated users can **upload** files to their own folder only
- ✅ Users can **delete** only their own files
- ❌ Users **cannot** upload to other users' folders

### Step 3: Verify Setup

#### Check Buckets
1. Go to **Storage** in Supabase Dashboard
2. You should see two buckets:
   - `audio-recordings`
   - `user-photos`
3. Both should show "Public" badge

#### Check Policies
1. Click on each bucket
2. Go to **"Policies"** tab
3. You should see 4 policies per bucket:
   - Public Access - View
   - Authenticated Users - Upload own files
   - Users - Update own files
   - Users - Delete own files

## File Organization

Your storage will be organized like this:

```
audio-recordings/
├── {user-uuid-1}/
│   ├── recording-1234567890.webm
│   └── recording-9876543210.webm
└── {user-uuid-2}/
    └── recording-1111111111.webm

user-photos/
├── {user-uuid-1}/
│   ├── photo-0-1234567890.jpg
│   ├── photo-1-1234567890.jpg
│   ├── photo-2-1234567890.jpg
│   ├── photo-3-1234567890.jpg
│   └── photo-4-1234567890.jpg
└── {user-uuid-2}/
    ├── photo-0-9876543210.jpg
    └── ...
```

Each user gets their own folder (named by their UUID from Supabase auth).

## Testing

After setup, test the storage:

1. **Sign up** for a new account in your app
2. **Record audio** - should upload to `audio-recordings/{your-user-id}/`
3. **Upload photos** - should upload to `user-photos/{your-user-id}/`
4. Check the **Storage** tab in Supabase Dashboard to verify files are there

## Troubleshooting

### ❌ RLS Error: "new row violates row-level security policy"

This is the most common error. You have two options:

#### Option A: Quick Fix (Development Only)
Disable RLS completely for fast development:

1. Go to **SQL Editor**
2. Run: `disable-rls-dev.sql`
3. This turns off security (DO NOT use in production!)

#### Option B: Fix Policies (Recommended for Production)
Keep RLS enabled but fix the policies:

1. Go to **SQL Editor**
2. Run: `storage-policies-fix.sql`
3. This drops and recreates all policies
4. Verify: Check Storage → Bucket → Policies tab (should see 4 policies per bucket)

**Debugging RLS Issues:**

Check if policies exist:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;
```

Should return 8 policies (4 for each bucket). If it returns 0, the policies weren't created.

### "Bucket not found" errors
- Make sure bucket names are **exactly**: `audio-recordings` and `user-photos`
- Check they are created in the correct Supabase project

### "Permission denied" errors
- Verify buckets are marked as **Public**
- Make sure you ran the storage policies SQL script
- Check that the user is authenticated (logged in)
- Try running `storage-policies-fix.sql` to recreate policies

### Files not uploading
- Check browser console for errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are set
- Check Supabase Dashboard → Logs for more details
- Verify you're logged in when uploading

### Files upload but can't be accessed
- Verify buckets are **Public**
- Check the file URLs in the database match the Supabase Storage URLs

## Manual Bucket Creation Alternative

If you prefer using SQL to create buckets (advanced):

```sql
-- Note: This requires admin privileges and is not recommended
-- It's easier to use the Dashboard UI

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('audio-recordings', 'audio-recordings', true),
  ('user-photos', 'user-photos', true);
```

However, **we recommend using the Dashboard UI** as shown in Step 1.

## Security Notes

**Current Setup:**
- ✅ Public read (anyone can download if they have the URL)
- ✅ Authenticated write (only logged-in users can upload)
- ✅ Owner-only delete (users can only delete their own files)

**Why this is secure:**
- File URLs are hard to guess (includes timestamps and UUIDs)
- Users can't delete or overwrite other users' files
- Only authenticated users can upload

**Future Enhancements:**
- Add file size limits
- Add file type validation
- Add rate limiting
- Set up automatic deletion of old files

## Next Steps

After setting up storage:
1. ✅ Create both buckets
2. ✅ Run storage policies SQL
3. ✅ Test uploading audio and photos
4. 🚀 Deploy to production!

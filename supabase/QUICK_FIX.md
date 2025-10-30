# Quick Fix for RLS Errors

## ❌ Getting this error?
```
Error: new row violates row-level security policy
```

## ✅ Quick Solution (Choose One)

### Option A: Disable RLS (Fast - Development Only)
**Use for:** Local development, testing
**Time:** 30 seconds

```bash
# Run this in Supabase SQL Editor
```
```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning:** This disables security. DO NOT use in production!

---

### Option B: Fix Policies (Secure - Recommended)
**Use for:** Production, or if you want proper security
**Time:** 1 minute

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `storage-policies-fix.sql` from this folder
3. Copy all the SQL
4. Paste into SQL Editor
5. Click **Run**

This will drop and recreate all storage policies properly.

---

## How to Verify It Worked

### After Option A (Disabled RLS):
Run this query:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```
Should show: `rowsecurity = false`

### After Option B (Fixed Policies):
1. Go to **Storage** → Click `audio-recordings` bucket
2. Click **Policies** tab
3. Should see **4 policies** listed

Or run this query:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'objects';
```
Should return **8 policy names** (4 per bucket)

---

## Still Having Issues?

### Check if you're logged in
The upload happens AFTER authentication. Make sure:
- You signed up or logged in
- You can see your email in the top right corner
- Check browser console for auth errors

### Check the file path
Storage policies check if the file path starts with your user ID.

Files should be uploaded as:
- `{userId}/recording-{timestamp}.webm` (for audio)
- `{userId}/photo-0-{timestamp}.jpg` (for photos)

If the path is different, the policy will reject it.

### Check Supabase logs
Go to **Supabase Dashboard** → **Logs** → **Postgres Logs**
Look for RLS errors with more details

---

## For Production Deployment

Before deploying to Railway/Vercel:

1. **Enable RLS:**
   ```sql
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

2. **Run:** `storage-policies-fix.sql`

3. **Verify:** Check that all 8 policies exist

4. **Test:** Try uploading as a logged-in user

---

## Summary

| Scenario | Solution | File to Run |
|----------|----------|-------------|
| Local dev, need it working NOW | Disable RLS | `disable-rls-dev.sql` |
| Production or want security | Enable with policies | `storage-policies-fix.sql` |
| Moving dev → production | Enable RLS first | `enable-rls-prod.sql` then `storage-policies-fix.sql` |

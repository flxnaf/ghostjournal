# 🚀 Quick Fix for Railway Client-Side Exception

## The Problem
Your app is crashing with a client-side exception because **Supabase environment variables are missing**.

## The Solution (3 Steps)

### Step 1: Get Supabase Credentials
1. Go to https://supabase.com/ and create a free project
2. Wait ~2 minutes for it to provision
3. Go to **Settings** → **API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the long JWT token)

### Step 2: Add to Railway
1. Open your Railway project
2. Click your service → **Variables** tab
3. Add these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
FISH_AUDIO_API_KEY=...
```

**Where to get DATABASE_URL:**
- Supabase → **Settings** → **Database** → **Connection String** → **URI**
- Use the **"Connection Pooling"** option (better for Railway)
- Replace `[YOUR-PASSWORD]` with your database password

### Step 3: Redeploy
1. Click **Deploy** → **Redeploy** in Railway
2. Wait for build to complete
3. Open your app URL - it should work now! ✅

## Still Not Working?

Check the Railway logs:
1. Go to **Deployments** → Latest → **View Logs**
2. Look for errors about missing variables
3. Make sure all variables start with the correct prefix:
   - `NEXT_PUBLIC_` for client-side variables (Supabase URL and key)
   - No prefix for server-side variables (API keys)

## Test Locally First (Optional)

Before deploying, test locally:
```bash
# Copy environment template
cp env.template .env

# Edit .env with your values
nano .env

# Check if all variables are set
node scripts/check-env.js

# Run the app
npm run dev
```

## What We Changed

✅ Added error handling in `lib/supabase.ts`  
✅ Added validation in `lib/hooks/useAuth.tsx`  
✅ Created helpful error message component  
✅ Updated build script to include `prisma generate`  
✅ Created this guide!

Now instead of a cryptic error, you'll see a clear message telling you exactly what's missing.

## Need More Help?

See **RAILWAY_FIX.md** for detailed troubleshooting and common issues.


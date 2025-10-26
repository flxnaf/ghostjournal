# Railway Deployment Fix - Client-Side Exception

## Problem
The client-side exception you're seeing is caused by **missing Supabase environment variables** in Railway. The app tries to initialize Supabase with placeholder values, which causes authentication to fail.

## Solution

### 1. Set Required Environment Variables in Railway

Go to your Railway project → Select your service → Variables tab → Add these:

#### **Critical - Authentication (Required for app to work)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Critical - Database Connection**
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

#### **Critical - AI Services**
```bash
ANTHROPIC_API_KEY=sk-ant-...
FISH_AUDIO_API_KEY=...
```

#### **Optional - Additional Features**
```bash
NEXT_PUBLIC_BASE_URL=https://your-app.up.railway.app
CHROMA_HOST=localhost
CHROMA_PORT=8000
FETCH_AI_API_KEY=...
```

### 2. Get Supabase Credentials

If you don't have a Supabase project yet:

1. Go to https://supabase.com/
2. Create a new project (free tier is fine)
3. Wait for project to finish provisioning (~2 minutes)
4. Go to **Settings** → **API**
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → **anon/public** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
6. Go to **Settings** → **Database** → **Connection String** → **URI**
7. Copy the connection string → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password
   - Use **"Connection Pooling"** for Railway (serverless environment)

### 3. Set Up Supabase Database Schema

After setting environment variables, you need to run migrations:

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

#### Option B: Using Railway Dashboard
1. Go to Railway → Your Service → Settings
2. Under **Deploy**, add a custom **Build Command**:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
3. Redeploy

### 4. Verify Environment Variables

After adding the variables, check the Railway logs:

1. Go to **Deployments** → Latest deployment → **View Logs**
2. Look for:
   - ✅ `Supabase client initialized successfully`
   - ❌ `Supabase environment variables not configured!` (if still missing)

### 5. Redeploy

After adding all environment variables:
1. Click **Deploy** → **Redeploy**
2. Or make a git commit and push (auto-deploys)

### 6. Test the Deployment

1. Open your Railway URL: `https://your-app.up.railway.app`
2. You should see the landing page without errors
3. Try to sign up/login
4. Check browser console (F12) for any remaining errors

## Quick Checklist

- [ ] Supabase project created
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Railway
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` added to Railway
- [ ] `DATABASE_URL` added to Railway (PostgreSQL connection string)
- [ ] `ANTHROPIC_API_KEY` added (Claude API)
- [ ] `FISH_AUDIO_API_KEY` added (voice cloning)
- [ ] Database migrations run (`npx prisma migrate deploy`)
- [ ] Railway service redeployed
- [ ] App loads without errors
- [ ] Can sign up/login successfully

## Common Issues

### Issue 1: "Failed to fetch" or network errors
**Cause:** Supabase URL is incorrect or not set  
**Fix:** Double-check the URL format: `https://xxxxx.supabase.co` (no trailing slash)

### Issue 2: "Invalid JWT"
**Cause:** Using the wrong Supabase key (e.g., service key instead of anon key)  
**Fix:** Use the **anon/public** key from Supabase dashboard, not the service_role key

### Issue 3: Database connection errors
**Cause:** Wrong DATABASE_URL or password  
**Fix:** 
- Use **Connection Pooling** URL (not Direct Connection) for Railway
- Make sure password is URL-encoded (e.g., `@` becomes `%40`)
- Test connection string locally first

### Issue 4: "Prisma Client not generated"
**Cause:** Build command doesn't include `npx prisma generate`  
**Fix:** Update build command to:
```bash
npm install && npx prisma generate && npm run build
```

### Issue 5: Still seeing client-side exception after adding vars
**Cause:** Environment variables not loaded or Railway needs restart  
**Fix:**
1. Make sure variables are in the **"Variables"** tab (not Secrets)
2. Use `NEXT_PUBLIC_` prefix for client-side variables
3. Redeploy completely (not just restart)

## What Changed in the Code

I've updated three files to handle missing environment variables gracefully:

1. **`lib/supabase.ts`** - Added validation to check if Supabase env vars are set
2. **`lib/hooks/useAuth.tsx`** - Added early return if Supabase is not configured
3. **`components/EnvErrorMessage.tsx`** - Created helpful error message component
4. **`app/page.tsx`** - Show error message instead of crashing

Now, instead of a cryptic client-side exception, users will see a clear error message with instructions on how to fix it.

## Next Steps After Fixing

Once the app is running:
1. Test the full user flow (signup → record voice → upload photos → chat)
2. Monitor Railway logs for any API errors
3. Check usage/costs in Railway dashboard
4. (Optional) Set up custom domain
5. (Optional) Set up error monitoring (Sentry, LogRocket, etc.)

## Need More Help?

If you're still seeing errors after following these steps:
1. Share the complete error from Railway logs
2. Share the browser console errors (F12)
3. Verify all environment variables are set correctly
4. Check that Supabase project is running (not paused)


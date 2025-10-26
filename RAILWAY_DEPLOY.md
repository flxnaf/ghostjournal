# Railway Backend Deployment

## Why Railway?

Vercel is optimized for **static/serverless frontends**, but GhostJournal needs:
- **SQLite database** (or PostgreSQL)
- **File uploads** (user photos, audio)
- **Long-running processes** (voice cloning, face analysis)

Railway provides a **full backend environment** for this.

## Deployment Steps

### 1. Sign Up for Railway
- Go to https://railway.app/
- Sign in with GitHub

### 2. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose your `ghostjournal` repository

### 3. Configure Environment Variables
Click on your project → Variables → Add the following:

```bash
# Database (Railway will auto-provide PostgreSQL, or use SQLite)
DATABASE_URL="file:./dev.db"

# Anthropic (Claude) - REQUIRED
ANTHROPIC_API_KEY="sk-ant-..."

# Fish Audio - REQUIRED for voice cloning
FISH_AUDIO_API_KEY="..."

# App Configuration
NEXT_PUBLIC_BASE_URL="https://your-railway-app.up.railway.app"
PORT="3000"

# ChromaDB (Optional - using mock for hackathon)
CHROMA_HOST="localhost"
CHROMA_PORT="8000"

# Fetch.ai (Optional)
FETCH_AI_API_KEY="..."
```

### 4. Configure Build & Start Commands

Railway should auto-detect Next.js, but verify:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### 5. Set Up PostgreSQL (Recommended for Production)

For hackathon, SQLite (`file:./dev.db`) works fine.

For production:
1. In Railway, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will auto-create a `DATABASE_URL` variable
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 6. Configure Domain

Railway provides a default domain: `your-app.up.railway.app`

To use custom domain:
1. Go to Settings → Domains
2. Add your domain and configure DNS

### 7. File Uploads Storage

⚠️ **Important:** Railway's filesystem is ephemeral (resets on deploy).

For persistent uploads, integrate:
- **Cloudflare R2** (S3-compatible, free tier)
- **AWS S3**
- **Vercel Blob Storage**

Quick fix for hackathon:
- Keep uploads in `/public/uploads/` (will persist during session)
- For production, migrate to cloud storage

## Do You Need Vercel Too?

**No!** Railway hosts your **entire Next.js app** in one place:

```
┌─────────────────────────────────────────┐
│  RAILWAY (Everything)                   │
│  - Frontend (landing page, UI)         │
│  - API routes                           │
│  - Database (PostgreSQL/SQLite)         │
│  - File uploads                         │
│  - AI processing (Claude, Fish Audio)   │
└─────────────────────────────────────────┘
```

**For hackathon: Just use Railway. One deployment, one URL, done.** ✓

### Optional: Railway + Vercel Hybrid (for scale)

Only if you need:
- Vercel's global CDN for faster page loads
- Separate frontend/backend scaling

To implement:
1. Deploy full app to Railway (backend)
2. Deploy frontend to Vercel
3. Add proxy in `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-railway-app.up.railway.app/api/:path*" }
     ]
   }
   ```

**But for your hackathon: Railway alone is perfect!**

## Testing Deployment

After deployment:

1. Open your Railway URL
2. You should see: **"GhostJournal - Your AI Clone"**
3. Click **"Get Started"** → Create account
4. Test the full flow:
   - Record voice ✓
   - Upload photos ✓
   - Add context ✓
   - Chat with clone ✓

## Common Issues

### "Cannot find module @prisma/client"
**Fix:** Run `npx prisma generate` in Railway CLI or add to build script:
```json
"build": "npx prisma generate && next build"
```

### File uploads fail
**Fix:** Check write permissions or migrate to cloud storage (see above)

### Environment variables not loading
**Fix:** Restart service after adding/updating variables

### Database connection error
**Fix:** Make sure `DATABASE_URL` is set correctly

## Monitoring

Railway provides:
- **Logs** (click "View Logs")
- **Metrics** (CPU, RAM, Network)
- **Deployments** (rollback if needed)

## Cost

Railway pricing:
- **Free tier:** $5 credit/month (enough for hackathon)
- **Hobby:** $5/month for more resources
- **Team:** $20/month for production

## Next Steps

- [ ] Deploy to Railway
- [ ] Test full user flow
- [ ] (Optional) Set up custom domain
- [ ] (Optional) Add PostgreSQL for production
- [ ] (Optional) Migrate file uploads to cloud storage
- [ ] Update frontend to use Railway API URL

---

**Quick start:** Just push your current code, Railway will handle the rest! 🚀


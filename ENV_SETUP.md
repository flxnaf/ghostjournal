# Environment Variables Setup Guide

## 📋 Quick Setup

```bash
# 1. Create your .env file from template
cp .env.template .env

# 2. Edit the .env file with your API keys
nano .env
# or
code .env

# 3. Verify your configuration
node scripts/check-env.js

# 4. You're ready to go!
npm run dev
```

---

## 🔑 Getting Your API Keys

### 1. Fish Audio API Key (REQUIRED)

**Purpose:** Voice cloning and text-to-speech generation

**Steps:**
1. Go to [fish.audio](https://fish.audio)
2. Sign up or log in
3. Navigate to **Dashboard** → **API Keys**
4. Click **Create New API Key**
5. Copy the key (it looks like: `fa_xxxxxxxxxxxxxxxxx`)
6. Paste into `.env` as `FISH_AUDIO_API_KEY`

**Cost:** Check their website for current pricing (usually has free tier)

**Documentation:** https://fish.audio/docs

---

### 2. Anthropic Claude API Key (REQUIRED)

**Purpose:** AI personality modeling and conversation generation

**Steps:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up (you'll get $5 in free credits!)
3. Navigate to **API Keys**
4. Click **Create Key**
5. Name it (e.g., "EchoSelf")
6. Copy the key (it looks like: `sk-ant-xxxxxxxxxxxxx`)
7. Paste into `.env` as `ANTHROPIC_API_KEY`

**Cost:** 
- Claude 3.5 Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
- You get $5 free credits to start
- Typical conversation costs: $0.01-0.05

**Documentation:** https://docs.anthropic.com/

---

### 3. ChromaDB (OPTIONAL but Recommended)

**Purpose:** Vector database for semantic memory search

**Option A: Local Docker (Recommended for Development)**

```bash
# Install Docker first if you haven't
# Then run:
docker run -d -p 8000:8000 --name chromadb chromadb/chroma

# Verify it's running:
curl http://localhost:8000/api/v1/heartbeat
# Should return: "OK"
```

In your `.env`:
```bash
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

**Option B: Python Installation**

```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**Option C: Skip It**

If you don't set up ChromaDB, the app will use a simplified memory system that stores memories in your database only (no semantic search).

**Cost:** Free when self-hosted

**Documentation:** https://docs.trychroma.com/

---

### 4. Fetch.ai Agentverse (OPTIONAL)

**Purpose:** Deploy your AI clone as an autonomous agent

**Steps:**
1. Go to [fetch.ai](https://fetch.ai)
2. Create account
3. Navigate to **Agentverse**
4. Generate API credentials
5. Add to `.env` as `FETCH_AI_API_KEY`

**Note:** This is completely optional. Skip if you just want the basic clone functionality.

**Documentation:** https://fetch.ai/docs

---

## 📝 Environment File Structure

Your `.env` file should look like this:

```bash
# Required
FISH_AUDIO_API_KEY=fa_your_actual_key_here
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here

# Database (default is fine for dev)
DATABASE_URL="file:./dev.db"

# Optional
CHROMA_HOST=localhost
CHROMA_PORT=8000
FETCH_AI_API_KEY=your_key_if_using_agents
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## ✅ Verify Your Setup

Run the environment checker:

```bash
node scripts/check-env.js
```

Expected output:
```
🔍 Checking environment configuration...

📋 Required Variables:
  ✅ FISH_AUDIO_API_KEY: fa_xxxxxxxxx...
  ✅ ANTHROPIC_API_KEY: sk-ant-xxxxx...
  ✅ DATABASE_URL: file:./dev.db

📋 Optional Variables:
  ✅ CHROMA_HOST: localhost
  ✅ CHROMA_PORT: 8000
  ⚠️  FETCH_AI_API_KEY: Not set (optional)
  ✅ NEXT_PUBLIC_BASE_URL: http://localhost:3000

==================================================
✅ All configuration looks good!
```

---

## 🔒 Security Best Practices

### DO:
- ✅ Keep your `.env` file private
- ✅ Use different API keys for dev/production
- ✅ Rotate keys periodically
- ✅ Set spending limits on API accounts
- ✅ Monitor usage in API dashboards

### DON'T:
- ❌ Commit `.env` to git (it's already in `.gitignore`)
- ❌ Share your API keys publicly
- ❌ Use production keys in development
- ❌ Screenshot your `.env` file
- ❌ Store keys in code comments

---

## 🐛 Troubleshooting

### "API key not configured" warnings

**Cause:** API keys not set or have placeholder values

**Fix:**
```bash
# Check your .env file
cat .env | grep API_KEY

# Make sure you replaced the placeholder values
# Should NOT contain: "your_" or "_here"
```

### ChromaDB connection errors

**Check if running:**
```bash
curl http://localhost:8000/api/v1/heartbeat
```

**Not running?**
```bash
# Start it
docker run -d -p 8000:8000 chromadb/chroma

# Or if using Python
chroma run --host localhost --port 8000
```

**Skip ChromaDB:**
```bash
# Comment out in .env:
# CHROMA_HOST=localhost
# CHROMA_PORT=8000

# App will use simplified memory storage
```

### "Invalid API key" errors

**Check key format:**
- Fish Audio: Should start with `fa_`
- Anthropic: Should start with `sk-ant-`

**Regenerate keys:**
- Go to respective API dashboard
- Revoke old key
- Create new key
- Update `.env`

### Database errors

**Reset database:**
```bash
rm prisma/dev.db
npx prisma db push
```

---

## 🔄 Updating Environment Variables

### During Development

1. Edit `.env` file
2. Restart dev server (`Ctrl+C` then `npm run dev`)
3. Changes take effect immediately

### In Production (Vercel)

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/update variables
5. Redeploy for changes to take effect

---

## 📊 API Usage Monitoring

### Fish Audio
- Dashboard → Usage & Billing
- Monitor voice generations
- Set spending alerts

### Anthropic
- Console → Usage
- Track token consumption
- View cost breakdown

### Best Practices
- Start with small tests
- Monitor costs daily during development
- Set up billing alerts
- Use rate limiting in production

---

## 💰 Cost Estimation

### Development/Testing (100 conversations)
- Fish Audio: ~$1-5 (depending on usage)
- Claude API: ~$0.50-2
- ChromaDB: Free (self-hosted)
- **Total: ~$1.50-7**

### Production (1,000 conversations)
- Fish Audio: ~$10-50
- Claude API: ~$5-20
- ChromaDB: Free or cloud costs
- **Total: ~$15-70**

*Costs vary based on usage patterns. Always check current API pricing.*

---

## 🆘 Need Help?

1. **Check logs:** Browser console (F12) and terminal
2. **Verify env:** `node scripts/check-env.js`
3. **Test APIs:** Use provided curl commands
4. **Reset everything:**
   ```bash
   rm -rf node_modules package-lock.json
   rm prisma/dev.db
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - General setup instructions
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

---

**Your environment is ready when all required API keys are set!** 🎉


# EchoSelf Setup Guide

Step-by-step instructions to get EchoSelf running on your machine.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

Optional but recommended:
- **Docker** - For running ChromaDB locally
- **VS Code** - Recommended editor

---

## 🔧 Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd CalHacks
```

---

## 📦 Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js
- React
- TypeScript
- Prisma
- Tailwind CSS
- Framer Motion
- API SDKs (Anthropic, ChromaDB, Axios)

---

## 🔑 Step 3: Get API Keys

### Required APIs

#### 1. Fish Audio API
**For voice cloning and text-to-speech**

1. Go to [fish.audio](https://fish.audio)
2. Sign up / Log in
3. Navigate to **Dashboard** → **API Keys**
4. Create new API key
5. Copy the key

**Pricing:** Check their website for current rates (usually has free tier)

#### 2. Anthropic Claude API
**For AI conversations and personality modeling**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Log in
3. Navigate to **API Keys**
4. Create new key
5. Copy the key

**Pricing:** Pay-as-you-go ($3-15 per million tokens depending on model)  
**Note:** You get free credits when you sign up

### Optional APIs

#### 3. Fetch.ai Agentverse (Optional)
**For autonomous agent deployment**

1. Go to [fetch.ai](https://fetch.ai)
2. Create account
3. Access **Agentverse**
4. Generate API credentials

**Note:** Skip this if you just want basic functionality

---

## ⚙️ Step 4: Configure Environment

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` with your favorite editor:

```bash
# Required APIs
FISH_AUDIO_API_KEY=fa_xxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Database (default is fine for development)
DATABASE_URL="file:./dev.db"

# Optional: ChromaDB (skip if not using)
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Optional: Fetch.ai
FETCH_AI_API_KEY=your_key_here

# Optional: Base URL (auto-detected in dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🗄️ Step 5: Setup Database

Initialize Prisma and create database:

```bash
# Generate Prisma Client
npx prisma generate

# Create database and tables
npx prisma db push
```

You should see output like:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your Prisma schema
```

Optional - Open Prisma Studio to view database:
```bash
npx prisma studio
```

---

## 🧊 Step 6: Setup ChromaDB (Optional)

ChromaDB provides vector memory storage. Skip this step if you want to try the app without it (it will use mock storage).

### Option A: Docker (Recommended)

```bash
docker run -d -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  --name chromadb \
  chromadb/chroma
```

Verify it's running:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

Should return: `"OK"`

### Option B: Python

```bash
# Install Python 3.8+
pip install chromadb

# Run server
chroma run --host localhost --port 8000
```

### Option C: Skip It

The app will work without ChromaDB using a simplified memory system.

---

## 🚀 Step 7: Run Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✅ Step 8: Verify Everything Works

### Test 1: Homepage Loads
- You should see the "EchoSelf" title
- Dark background with neon accents
- "Start Recording" button

### Test 2: Record Audio
1. Click "Start Recording"
2. Allow microphone access
3. Speak for a few seconds
4. Recording should auto-stop after 20 seconds

### Test 3: Upload Photos
1. Click "Capture" for each angle
2. Allow camera access
3. Take 5 photos (or upload files)
4. Fill out context form (optional)
5. Click "Create My Clone"

### Test 4: Chat with Clone
1. After upload completes, chat interface appears
2. Type a message and send
3. Clone should respond (may take 5-10 seconds first time)
4. Voice audio should play automatically

---

## 🐛 Troubleshooting

### "Cannot find module 'X'"
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Errors
```bash
# Reset database
rm prisma/dev.db
npx prisma db push
```

### Microphone Not Working
- **Chrome:** Allow microphone in browser settings
- **Firefox:** May need HTTPS (use ngrok or similar for testing)
- **Safari:** Check System Preferences → Security → Privacy → Microphone

### Camera Not Working
- Ensure you're on `localhost` or `https://`
- Check browser permissions
- Try different browser

### API Errors

**Fish Audio:**
```bash
# Check API key is correct
echo $FISH_AUDIO_API_KEY

# Test API (replace with your key)
curl https://api.fish.audio/v1/voices \
  -H "Authorization: Bearer YOUR_KEY"
```

**Anthropic:**
```bash
# Test API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

### ChromaDB Connection Issues
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Check Docker container
docker ps | grep chroma

# View logs
docker logs chromadb
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## 🔄 Common Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View database
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Update dependencies
npm update

# Check for issues
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📁 File Upload Storage

By default, files are stored in `public/uploads/`.

For production, you'll want to use cloud storage:
- Vercel Blob
- AWS S3
- Cloudinary
- Google Cloud Storage

See `DEPLOYMENT.md` for details.

---

## 🎓 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Prisma
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### Fish Audio
- [Fish Audio Docs](https://fish.audio/docs)

### Anthropic Claude
- [Claude API Reference](https://docs.anthropic.com/claude/reference)

### ChromaDB
- [Chroma Documentation](https://docs.trychroma.com/)

### Fetch.ai
- [Fetch.ai Docs](https://fetch.ai/docs)

---

## 👥 Getting Help

If you run into issues:

1. **Check console logs** - Browser dev tools (F12) and terminal
2. **Review API documentation** - Links above
3. **Search for error messages** - Stack Overflow, GitHub issues
4. **Create GitHub issue** - For project-specific bugs
5. **Ask at hackathon** - Mentor support available

---

## 🎯 Next Steps

Once everything is running:

1. **Customize the UI** - Edit components and styles
2. **Improve personality prompts** - Modify API routes
3. **Add features** - Extend functionality
4. **Prepare demo** - Practice your pitch
5. **Deploy** - See `DEPLOYMENT.md`

---

## 🎉 You're Ready!

Your EchoSelf clone should now be running locally.

Happy hacking! 🚀


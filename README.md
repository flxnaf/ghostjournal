# EchoSelf 🎭

> **Your Interactive Voice + Visual AI Clone**  
> Built for Cal Hacks 12.0

An immersive dark-mode web application that creates an animated AI clone of you using:
- **Voice cloning** (Fish Audio API)
- **Visual representation** with audio-reactive waveforms
- **Personality modeling** (Claude API)
- **Long-term memory** (ChromaDB)
- **Optional autonomous deployment** (Fetch.ai Agentverse)

---

## ✨ Features

### 🎤 Voice Cloning
Record 20 seconds of audio to create a personalized voice model using Fish Audio's state-of-the-art TTS technology.

### 📸 Visual Clone
Capture 5 selfies (front, left, right, up, down) to generate a ghostly outline of your face rendered with live audio waveforms.

### 🧠 Personality Model
Share stories, habits, and reactions to build a personality profile powered by Claude that makes your clone authentically *you*.

### 💾 Vector Memory
All conversations and contexts are stored in ChromaDB, enabling your clone to recall past interactions and maintain context.

### 🤖 Autonomous Agent (Optional)
Deploy your clone to Fetch.ai's Agentverse where it can operate independently, interact with other agents, and persist beyond your session.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** (dark mode, custom neon palette)
- **Framer Motion** (animations)
- **Web Audio API** (waveform visualization)

### Backend
- **Next.js API Routes** (serverless functions)
- **Prisma** (ORM)
- **SQLite** (development database)

### AI & APIs
- **Fish Audio** - Voice cloning & TTS
- **Anthropic Claude** - Personality generation & conversation
- **ChromaDB** - Vector memory storage
- **Fetch.ai** - Autonomous agent deployment (optional)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- (Optional) ChromaDB server running locally or remotely

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd CalHacks
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Required APIs
FISH_AUDIO_API_KEY=your_fish_audio_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DATABASE_URL="file:./dev.db"

# Optional: ChromaDB (defaults to localhost:8000)
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Optional: Fetch.ai
FETCH_AI_API_KEY=your_fetch_ai_api_key_here

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. (Optional) Start ChromaDB

If you want persistent vector memory:

```bash
# Using Docker
docker run -p 8000:8000 chromadb/chroma

# Or install locally
pip install chromadb
chroma run --host localhost --port 8000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 API Keys Setup

### Fish Audio API
1. Sign up at [fish.audio](https://fish.audio)
2. Navigate to API settings
3. Generate API key
4. Add to `.env` as `FISH_AUDIO_API_KEY`

**Documentation:** https://fish.audio/docs

### Anthropic Claude API
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Generate API key
3. Add to `.env` as `ANTHROPIC_API_KEY`

**Documentation:** https://docs.anthropic.com/

### ChromaDB (Optional but Recommended)
- **Local:** Run `chroma run` after installing via pip
- **Cloud:** Use Chroma Cloud or deploy your own instance

**Documentation:** https://docs.trychroma.com/

### Fetch.ai Agentverse (Optional)
1. Sign up at [fetch.ai](https://fetch.ai)
2. Create Agentverse account
3. Generate API credentials
4. Add to `.env` as `FETCH_AI_API_KEY`

**Documentation:** https://fetch.ai/docs

---

## 📁 Project Structure

```
CalHacks/
├── app/
│   ├── api/                    # API routes
│   │   ├── upload/            # Media upload handler
│   │   ├── voice-clone/       # Fish Audio integration
│   │   ├── personality/       # Claude personality generation
│   │   ├── memory/            # ChromaDB memory operations
│   │   ├── speak/             # Generate AI responses
│   │   ├── face-data/         # Face outline extraction
│   │   └── fetch-agent/       # Fetch.ai agent deployment
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── Recorder.tsx           # Audio recording interface
│   ├── Uploader.tsx           # Photo & context upload
│   ├── WaveformCanvas.tsx     # Audio-reactive visualization
│   └── CloneChat.tsx          # Chat interface
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── api-clients.ts         # API client configurations
│   ├── audio-utils.ts         # Audio processing utilities
│   ├── face-utils.ts          # Face detection utilities
│   └── hooks/                 # Custom React hooks
│       ├── useAudioRecorder.ts
│       └── useCamera.ts
├── prisma/
│   └── schema.prisma          # Database schema
├── types/
│   └── index.ts               # TypeScript types
├── public/
│   └── uploads/               # User uploaded media
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts         # Tailwind configuration
└── next.config.js
```

---

## 🎨 Visual Design

### Color Palette
- **Background:** `#0a0a0f` (dark-bg)
- **Surface:** `#12121a` (dark-surface)
- **Neon Blue:** `#00d9ff`
- **Neon Cyan:** `#00fff5`
- **Neon Purple:** `#bf00ff`
- **Neon Pink:** `#ff00bf`

### Animation Style
- **Ghost in the Shell / Daft Punk aesthetic**
- Pulsing waveform outlines
- Smooth glowing transitions
- Minimalist dark UI with neon accents

---

## 🔄 User Flow

1. **Record Voice** (20 seconds)
   - Visualize audio levels in real-time
   - Auto-stop after duration

2. **Capture Photos** (5 angles)
   - Use webcam or upload files
   - Front, Left, Right, Up, Down views

3. **Share Context**
   - Stories, habits, reactions
   - Build personality model

4. **Chat with Clone**
   - Text conversation
   - AI-generated voice responses
   - Audio-reactive visual representation
   - Memory-enhanced interactions

---

## 🧪 Development Notes

### Mock Modes
The app gracefully degrades if API keys are missing:
- **Fish Audio:** Uses mock voice model IDs, skips TTS
- **Claude:** Returns basic personality template
- **ChromaDB:** Falls back to database-only storage
- **Fetch.ai:** Disables agent deployment

### Face Detection
Currently uses mock elliptical outlines. For production:
1. Install `face-api.js` or `opencv4nodejs`
2. Implement landmark detection in `/app/api/face-data/route.ts`
3. See comments in `lib/face-utils.ts` for integration guide

### Database
- **Development:** SQLite (file-based)
- **Production:** Consider PostgreSQL with Prisma

---

## 📦 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

**Environment Variables:** Add all `.env` variables in Vercel dashboard

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### ChromaDB Deployment
For production, deploy ChromaDB separately:
- Use Chroma Cloud
- Deploy on Railway/Render
- Self-host with Docker

---

## 🎯 Hackathon Tracks

This project qualifies for:
- **Fish Audio Track:** Voice cloning & TTS implementation
- **Anthropic Track:** Claude-powered personality modeling
- **Fetch.ai Track:** Agent deployment on Agentverse
- **Best Overall:** Innovative use of multiple AI technologies

---

## 🐛 Troubleshooting

### Audio Recording Issues
- **Firefox:** May require HTTPS or localhost
- **Safari:** Check microphone permissions in System Preferences

### Camera Access
- Ensure HTTPS (or localhost for development)
- Check browser permissions

### ChromaDB Connection
- Verify server is running: `curl http://localhost:8000/api/v1/heartbeat`
- Check firewall settings

### API Errors
- Verify API keys are correct
- Check rate limits
- Review console logs for details

---

## 🔮 Future Enhancements

- [ ] Multi-language voice cloning
- [ ] 3D face model rendering
- [ ] Real-time conversation mode
- [ ] Mobile app (React Native)
- [ ] Group clone interactions
- [ ] Voice modulation controls
- [ ] Advanced face detection with expressions
- [ ] Cloud-based persistent agents

---

## 📄 License

MIT License - Built for Cal Hacks 12.0

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 👥 Team

Built with ❤️ by [Your Team Name]

---

## 🙏 Acknowledgments

- **Fish Audio** - Voice cloning technology
- **Anthropic** - Claude API
- **Chroma** - Vector database
- **Fetch.ai** - Agent infrastructure
- **Cal Hacks** - Amazing hackathon opportunity

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check API documentation
- Review troubleshooting section

**Happy Hacking! 🚀**


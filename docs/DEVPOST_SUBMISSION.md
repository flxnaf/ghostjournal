# Replik - Your Digital Clone, Everywhere

## 🎯 Inspiration

What if you could create a digital version of yourself that truly understands you - your voice, your personality, your memories? What if that clone could exist not just on the web, but in your favorite games like Minecraft? 

Replik makes this possible. We built a platform where you can train an AI clone with your voice, face, and personal context, then bring it to life anywhere - from web browsers to video games.

## 🚀 What it does

**Replik** is a full-stack platform that creates personalized AI clones with three core capabilities:

### 1. **Clone Creation & Training**
- 🎤 **Voice Cloning**: Record 30 seconds of audio to train a custom Fish Audio model that sounds exactly like you
- 📸 **Face Capture**: MediaPipe-powered facial recognition for emotion detection and 3D visualization
- 🧠 **Context Builder**: Add stories, habits, reactions, and memories to define your clone's personality
- 💬 **Natural Conversation**: Claude AI powers contextually-aware responses that match your tone and style

### 2. **Clone Sharing & Discovery**
- 🌐 **Public/Private Profiles**: Share your clone with friends or keep it personal
- 🔍 **Clone Browser**: Search and interact with other people's digital clones
- 📥 **JSON Export**: Download your clone data (personality, voice model, face data) for portability

### 3. **Minecraft Integration** (The Game-Changer!)
- 🎮 **In-Game NPCs**: Import your Replik clone into Minecraft as a fully functional NPC
- 🎨 **Custom Skins**: NPCs display your linked Minecraft skin or default to Steve
- 💬 **AI-Powered Chat**: Right-click NPCs to have natural conversations powered by your clone's personality
- 🔊 **Voice Responses**: NPCs speak back using your trained voice model via Fish Audio TTS
- 👥 **Multi-Clone Support**: Import all your friends as NPCs and build a village of digital clones!

**Commands:**
- `/twinimport @username` - Import a Replik clone
- `/twinspawn username` - Spawn the NPC in-game
- `/twin username <message>` - Chat with your clone

## 🛠️ How we built it

### Frontend (Next.js 14 + TypeScript)
- **UI/UX**: React with Framer Motion animations, TailwindCSS for styling
- **3D Visualization**: Three.js for real-time face rendering with emotion detection
- **Audio Recording**: MediaRecorder API for voice capture
- **Face Processing**: MediaPipe Face Mesh for 468 facial landmarks

### Backend (Next.js API Routes + Serverless)
- **Database**: PostgreSQL via Prisma ORM on Supabase
- **Authentication**: Supabase Auth with username/email login
- **Storage**: Supabase Storage for audio recordings and profile photos
- **AI Integration**:
  - **Claude API** (Anthropic) for personality generation and natural conversation
  - **Fish Audio API** for voice cloning and text-to-speech
- **Deployment**: Railway with connection pooling and environment management

### Minecraft Mod (Fabric + Kotlin)
- **Framework**: Fabric Loader 1.20.1 with Fabric API
- **Language**: Kotlin for cleaner, more expressive code
- **Networking**: Custom packet system for client-server communication
- **Entity System**: Custom `TwinEntity` extending `MobEntity` with:
  - DataTracker for client-server skin synchronization
  - AI goals (look at players, wander, swim)
  - Custom renderer using player model
- **Skin System**: Dynamic texture loading from Mojang API or user-provided URLs
- **Chat GUI**: Custom Minecraft-style chat interface with:
  - Text wrapping for color codes
  - Persistent chat history per clone
  - Async API calls for smooth gameplay
- **Audio Playback**: System audio player integration (`afplay` on macOS)

### Key Technical Achievements
1. **Real-time Voice Training**: Integrated Fish Audio's API for custom voice model training with fallback to default voices
2. **Cross-Platform Clone Data**: JSON-based export system for portability between web and game
3. **Emotion Detection**: Analyzing AI responses to dynamically change face color (red=angry, blue=sad, etc.)
4. **Row Level Security**: Proper Supabase RLS policies with service role key for backend operations
5. **Entity Synchronization**: DataTracker-based skin syncing across Minecraft clients
6. **Memory Context System**: Prisma-based memory storage with semantic search capabilities

## 😅 Challenges we ran into

### 1. **Fish Audio API Confusion**
- **Problem**: Voice models weren't working - random voices played instead of trained ones
- **Root Cause**: Fish Audio uses `reference_id` for trained models, but `voice_id` for defaults
- **Solution**: Added extensive logging and corrected API parameter usage

### 2. **Minecraft Skin Caching Bug**
- **Problem**: All NPCs showed the same skin (the last one spawned)
- **Root Cause**: Texture IDs used entity names, causing overwrites
- **Solution**: Changed to hash-based texture IDs for uniqueness

### 3. **Supabase RLS Nightmares**
- **Problem**: "new row violates row-level security policy" on every upload
- **Root Cause**: RLS policies blocked authenticated uploads
- **Solution**: Used service role key on backend to bypass RLS

### 4. **Railway Database Connection Issues**
- **Problem**: "Can't reach database server" and "prepared statement already exists"
- **Root Cause**: Using direct connection instead of pooled, and missing `?pgbouncer=true`
- **Solution**: Separate `DATABASE_URL` (pooled) and `DIRECT_URL` (migrations) with proper query params

### 5. **Username Persistence Across Systems**
- **Problem**: Username changes reverted on page refresh
- **Root Cause**: Data stored in two places (Supabase Auth metadata + Prisma DB) that were out of sync
- **Solution**: Update both systems simultaneously, fetch from database (single source of truth)

### 6. **Minecraft Entity Attribute Registration**
- **Problem**: Custom entity attributes causing crashes
- **Root Cause**: Fabric API registry timing issues
- **Solution**: Reflection-based attribute registration as fallback

## 🏆 Accomplishments that we're proud of

1. **Full Voice Cloning Pipeline**: From 30-second recording to deployable voice model in minutes
2. **Seamless Game Integration**: First-of-its-kind Minecraft mod that brings web-based AI clones into the game
3. **Natural Conversations**: Claude-powered responses that actually sound like you, not generic AI
4. **Production-Ready Architecture**: Proper database pooling, RLS policies, and error handling
5. **Context-Aware AI**: Memory system that references your stories/habits when relevant, not constantly
6. **Cross-Platform Portability**: Export your clone as JSON and use it anywhere
7. **Real-Time 3D Visualization**: Live face rendering with emotion detection
8. **Multi-User Clone Sharing**: Browse, interact with, and download friends' clones

## 📚 What we learned

### Technical Skills
- **Serverless Architecture**: Railway deployment, connection pooling, environment management
- **AI API Integration**: Working with Claude and Fish Audio APIs at scale
- **Minecraft Modding**: Fabric Loader, Kotlin, entity systems, networking protocols
- **Real-time Systems**: WebSocket-like communication between game and web server
- **Database Design**: Prisma schema design, UUID handling, relationship management

### Product Lessons
- **User Experience Matters**: Adding voice recording retries, error messages, and loading states made a huge difference
- **Debugging is Critical**: Extensive logging saved hours of troubleshooting
- **Privacy First**: Automatic audio deletion after training, public/private toggles
- **Simplicity Wins**: Reduced from 5 photos to 1, made admin bypass for testing

### Soft Skills
- **Persistence**: We hit 10+ critical bugs and fixed every single one
- **Problem Solving**: Each bug taught us more about the systems we were building
- **Time Management**: Prioritized features vs. polish to ship a working product

## 🚀 What's next for Replik

### Short-term (Next 2 Weeks)
1. **Voice Cloning Improvements**: Better audio quality, noise reduction
2. **More Context Types**: Skills, goals, values, corrections
3. **Enhanced Chat UI**: Message editing, delete, context critique button
4. **Minecraft Features**: 
   - NPC movement/pathfinding
   - Inventory trading
   - Custom animations

### Medium-term (Next Month)
1. **Multi-Game Support**: Extend beyond Minecraft (Unity plugin, Roblox, etc.)
2. **Mobile App**: iOS/Android app for on-the-go clone interaction
3. **Voice Calls**: Real-time voice chat with your clone (not just text-to-speech)
4. **API Access**: Developer API for third-party integrations

### Long-term Vision
1. **VR/AR Integration**: Meet your clone in virtual/augmented reality
2. **Multi-Modal Learning**: Train from chat logs, social media, emails
3. **Clone Evolution**: Learn and adapt over time from interactions
4. **Marketplace**: Buy/sell clone templates or personality packs
5. **Enterprise Use**: Customer service clones, sales assistants, educators

## 🎮 Try It Out!

### Web Platform
1. Visit: `https://your-domain.com` (or your Railway domain)
2. Sign up with username/email/password
3. Record 30 seconds of audio
4. Add context (stories, habits, reactions)
5. Chat with your clone!

### Minecraft Mod
1. Install Fabric Loader 1.20.1
2. Download `digitaltwins-1.0.0.jar` from our releases
3. Place in `.minecraft/mods` folder
4. Launch Minecraft
5. Run `/twinimport @YourReplikUsername`
6. Run `/twinspawn YourReplikUsername`
7. Right-click to chat with your clone!

## 🛠️ Built With

**Frontend:**
- Next.js 14
- TypeScript
- React
- TailwindCSS
- Framer Motion
- Three.js
- MediaPipe

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Auth
- Supabase Storage

**AI/ML:**
- Claude 3.5 Sonnet (Anthropic)
- Fish Audio API
- MediaPipe Face Mesh

**Game Integration:**
- Minecraft Fabric Loader 1.20.1
- Kotlin
- Fabric API
- OkHttp3
- Gson

**Infrastructure:**
- Railway (deployment)
- Supabase (database + storage)
- Git/GitHub

## 👥 Team

[Add your team members here]

## 📦 GitHub Repository

[Add your GitHub repo link here]

## 🎥 Demo Video

[Add your demo video link here]

---

*"Your digital clone, trained by you, living everywhere you go."* 🚀


# EchoSelf - Technical Architecture

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Browser (Chrome, Firefox, Safari)                         │  │
│  │  - WebRTC Media Devices (camera, microphone)              │  │
│  │  - Web Audio API (audio analysis)                         │  │
│  │  - HTML5 Canvas (waveform rendering)                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS/WSS
┌──────────────────────────▼───────────────────────────────────────┐
│                   NEXT.JS APPLICATION                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  FRONTEND LAYER (React Components)                         │  │
│  │  ├─ Recorder.tsx        (audio capture + visualization)    │  │
│  │  ├─ Uploader.tsx        (photo capture + context input)    │  │
│  │  ├─ WaveformCanvas.tsx  (audio-reactive rendering)         │  │
│  │  └─ CloneChat.tsx       (conversation interface)           │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │  API ROUTES (Serverless Functions)                         │  │
│  │  ├─ /api/upload         → Handle media uploads             │  │
│  │  ├─ /api/voice-clone    → Create voice model               │  │
│  │  ├─ /api/personality    → Generate personality             │  │
│  │  ├─ /api/memory         → Manage vector memory             │  │
│  │  ├─ /api/speak          → Generate AI responses            │  │
│  │  ├─ /api/face-data      → Extract face features            │  │
│  │  └─ /api/fetch-agent    → Deploy to Agentverse             │  │
│  └────────────────┬─────────┬──────────┬──────────┬───────────┘  │
└───────────────────┼─────────┼──────────┼──────────┼──────────────┘
                    │         │          │          │
┌───────────────────▼─────────▼──────────▼──────────▼──────────────┐
│                   EXTERNAL SERVICES                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Fish Audio   │ │ Anthropic    │ │ ChromaDB │ │ Fetch.ai    │ │
│  │ API          │ │ Claude API   │ │          │ │ Agentverse  │ │
│  │              │ │              │ │          │ │             │ │
│  │ • Voice      │ │ • Personality│ │ • Vector │ │ • Agent     │ │
│  │   Cloning    │ │   Modeling   │ │   Search │ │   Deploy    │ │
│  │ • TTS        │ │ • Response   │ │ • Embed  │ │ • Autonomy  │ │
│  │              │ │   Gen        │ │          │ │             │ │
│  └──────────────┘ └──────────────┘ └──────────┘ └─────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                    PERSISTENCE LAYER                              │
│  ┌──────────────────────┐        ┌───────────────────────────┐   │
│  │  Prisma ORM          │        │  File Storage             │   │
│  │  ├─ User             │        │  ├─ Audio recordings      │   │
│  │  ├─ Memory           │        │  ├─ Photos (5 angles)     │   │
│  │  └─ Conversation     │        │  └─ Generated TTS         │   │
│  └──────────┬───────────┘        └───────────────────────────┘   │
│             │                                                     │
│  ┌──────────▼───────────┐                                        │
│  │  SQLite Database     │  (Dev)                                 │
│  │  PostgreSQL          │  (Production)                          │
│  └──────────────────────┘                                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Initial Setup Flow

```
User Records Audio (20s)
        │
        ▼
[Audio Blob Created]
        │
        ▼
User Captures 5 Photos
        │
        ▼
User Fills Context Form
        │
        ▼
[FormData Submission]
        │
        ▼
POST /api/upload
        │
        ├──────────────────┐
        │                  │
        ▼                  ▼
   Save Files         Create User
   (public/uploads)   (Database)
        │                  │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
Background Processing  Return User ID
        │
   ┌────┼────┐
   │    │    │
   ▼    ▼    ▼
 Voice  │  Memory
 Clone  │  Init
    │   │    │
    │   ▼    │
    │ Personality
    │   Gen  │
    └───┬────┘
        │
        ▼
[Clone Ready]
```

### 2. Conversation Flow

```
User Types Message
        │
        ▼
POST /api/speak
        │
   ┌────┼────┐
   │    │    │
   ▼    ▼    ▼
Query  Get   Build
Memory User  Context
        │
        └────┬────┐
             │    │
        ┌────▼────▼────┐
        │ Generate Text │
        │ (Claude API)  │
        └───────┬───────┘
                │
        ┌───────▼────────┐
        │ Generate Voice │
        │ (Fish Audio)   │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │ Save Audio +   │
        │ Conversation   │
        └───────┬────────┘
                │
                ▼
        Return Response
        (Text + Audio URL)
                │
                ▼
        Frontend Plays Audio
        Animates Waveform
```

### 3. Memory Management Flow

```
┌─────────────────────────────────────────────┐
│         User Context Input                  │
│  • Stories                                  │
│  • Habits                                   │
│  • Reactions                                │
└──────────────┬──────────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Store in Database   │
    │  (Prisma → SQLite)   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Generate Embeddings │
    │  (ChromaDB Auto)     │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Store in Collection │
    │  (user_{userId})     │
    └──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
Semantic Search      Direct Recall
(during chat)        (personality gen)
```

---

## 🧩 Component Architecture

### Frontend Component Tree

```
app/page.tsx (Root)
    │
    ├─ Recorder Component
    │   ├─ Audio Input Handler
    │   ├─ MediaRecorder API
    │   ├─ AnalyserNode (Web Audio)
    │   └─ Real-time Visualizer
    │
    ├─ Uploader Component
    │   ├─ Camera Stream Handler
    │   ├─ Photo Capture (x5)
    │   ├─ Context Form
    │   └─ FormData Submission
    │
    └─ CloneChat Component
        ├─ Message List
        │   └─ Message Item (with audio)
        │
        ├─ WaveformCanvas Component
        │   ├─ Canvas Renderer
        │   ├─ Audio Analyser
        │   └─ Face Outline Drawer
        │
        └─ Input Box
```

### API Route Structure

```
app/api/
    │
    ├─ upload/route.ts
    │   ├─ Validate Files
    │   ├─ Save to Filesystem
    │   ├─ Create DB Records
    │   └─ Trigger Background Jobs
    │
    ├─ voice-clone/route.ts
    │   ├─ Read Audio File
    │   ├─ Upload to Fish Audio
    │   ├─ Train Voice Model
    │   └─ Store Model ID
    │
    ├─ personality/route.ts
    │   ├─ Fetch User Memories
    │   ├─ Build Context Prompt
    │   ├─ Call Claude API
    │   └─ Parse & Store Result
    │
    ├─ memory/route.ts
    │   ├─ Initialize Collection
    │   ├─ Add Memories
    │   └─ Query Semantically
    │
    ├─ speak/route.ts
    │   ├─ Query Memories
    │   ├─ Generate Text (Claude)
    │   ├─ Generate Audio (Fish)
    │   └─ Store Conversation
    │
    ├─ face-data/route.ts
    │   └─ Return Mock/Real Landmarks
    │
    └─ fetch-agent/route.ts
        ├─ Deploy Agent
        ├─ Check Status
        └─ Remove Agent
```

---

## 🔌 API Integration Patterns

### Fish Audio Integration

```typescript
// Voice Clone Creation
┌─────────────────────────────────┐
│ 1. Upload Audio File            │
│    POST /v1/voice/upload        │
│    → Returns: voice_id          │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ 2. Train Model (optional)       │
│    POST /v1/voice/{id}/train    │
│    → Returns: status            │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ 3. Store voice_id in DB         │
│    user.voiceModelId = id       │
└─────────────────────────────────┘

// Text-to-Speech
┌─────────────────────────────────┐
│ Generate Speech                 │
│    POST /v1/tts                 │
│    Body: {                      │
│      voice_id: "...",           │
│      text: "...",               │
│      format: "mp3"              │
│    }                            │
│    → Returns: audio binary      │
└─────────────────────────────────┘
```

### Claude Integration

```typescript
// Personality Generation
┌─────────────────────────────────┐
│ Build Context from Memories     │
│    memories.join('\n\n')        │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ Create Prompt                   │
│    "Analyze personality..."     │
│    + context                    │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ Call Claude API                 │
│    POST /v1/messages            │
│    Model: claude-3-5-sonnet     │
│    → Returns: analysis JSON     │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ Parse & Store                   │
│    user.personalityData = JSON  │
└─────────────────────────────────┘

// Response Generation
┌─────────────────────────────────┐
│ Build Conversation Context      │
│    • Personality prompt         │
│    • Relevant memories          │
│    • Recent messages            │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ Call Claude API                 │
│    messages: [...history]       │
│    system: personality          │
│    → Returns: response text     │
└─────────────────────────────────┘
```

### ChromaDB Integration

```typescript
// Initialize
┌─────────────────────────────────┐
│ Create/Get Collection           │
│    name: "user_{userId}"        │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│ Add Documents                   │
│    ids: [memory.id, ...]        │
│    documents: [content, ...]    │
│    metadatas: [category, ...]   │
│    → Auto-generates embeddings  │
└─────────────────────────────────┘

// Query
┌─────────────────────────────────┐
│ Semantic Search                 │
│    queryTexts: ["user query"]   │
│    nResults: 5                  │
│    → Returns: similar docs      │
└─────────────────────────────────┘
```

---

## 🗄️ Database Schema Details

### Entity Relationship Diagram

```
┌────────────────────────┐
│        User            │
├────────────────────────┤
│ id (PK)                │
│ audioUrl               │
│ photoUrls []           │
│ voiceModelId           │
│ personalityData (JSON) │
│ chromaCollectionId     │
│ fetchAgentId           │
│ name                   │
│ email                  │
│ createdAt              │
│ updatedAt              │
└───────┬────────────────┘
        │ 1
        │
        │ N
┌───────▼────────────────┐
│      Memory            │
├────────────────────────┤
│ id (PK)                │
│ userId (FK)            │
│ content                │
│ embedding              │
│ category               │
│ createdAt              │
└────────────────────────┘

        │ 1
        │
        │ N
┌───────▼────────────────┐
│   Conversation         │
├────────────────────────┤
│ id (PK)                │
│ userId (FK)            │
│ role                   │
│ content                │
│ audioUrl               │
│ createdAt              │
└────────────────────────┘
```

---

## 🎨 Frontend State Management

### Component State Flow

```
App State (page.tsx)
├─ step: 'record' | 'upload' | 'chat'
├─ userId: string | null
└─ audioBlob: Blob | null

Recorder State
├─ isRecording: boolean
├─ countdown: number
├─ audioLevel: number
└─ mediaRecorder: MediaRecorder

Uploader State
├─ photos: (File | null)[]
├─ cameraActive: boolean
├─ currentPhotoIndex: number
├─ contexts: {story, habit, reaction}
└─ uploading: boolean

CloneChat State
├─ messages: Message[]
├─ input: string
├─ isLoading: boolean
├─ isPlaying: boolean
├─ audioData: number[]
└─ faceOutline: number[][]

WaveformCanvas State
├─ animationFrame: number
├─ timeRef: number
└─ canvas context
```

---

## 🔐 Security Architecture

### Current Implementation

```
┌─────────────────────────────────┐
│   Browser (Client-Side)         │
│   • No sensitive data stored    │
│   • Blob URLs temporary         │
│   • HTTPS required for media    │
└──────────┬──────────────────────┘
           │ HTTPS
┌──────────▼──────────────────────┐
│   API Routes (Server-Side)      │
│   • Environment variables       │
│   • API key validation          │
│   • File size limits            │
│   • Basic input validation      │
└──────────┬──────────────────────┘
           │
┌──────────▼──────────────────────┐
│   External APIs                 │
│   • API keys in headers         │
│   • Rate limiting handled       │
└─────────────────────────────────┘
```

### Production Requirements

```
Additional Layers Needed:
├─ Authentication (NextAuth.js, Clerk)
├─ Rate Limiting (Upstash Redis)
├─ CSRF Protection
├─ Input Sanitization (Zod)
├─ File Upload Validation
├─ Database Access Control
└─ Logging & Monitoring (Sentry)
```

---

## 📊 Performance Characteristics

### Latency Breakdown

```
Voice Clone Creation: ~10-30 seconds
    ├─ File Upload: 1-3s
    ├─ Model Training: 5-20s
    └─ Storage: <1s

Personality Generation: ~3-5 seconds
    ├─ Memory Fetch: <1s
    ├─ Claude API: 2-4s
    └─ Storage: <1s

Response Generation: ~5-10 seconds
    ├─ Memory Query: 1-2s
    ├─ Claude Text Gen: 2-3s
    ├─ Fish TTS: 2-4s
    └─ File Save: <1s
```

### Bottleneck Analysis

```
Critical Path:
User Message → Response with Audio
    │
    ├─ Network Latency: 200-500ms
    ├─ Memory Query: 1-2s
    ├─ Claude API: 2-3s (blocking)
    ├─ Fish TTS: 2-4s (blocking)
    └─ Total: 5-10s

Optimizations:
    • Parallel API calls where possible
    • Cache frequent responses
    • Preload personality context
    • Use streaming responses
```

---

## 🔄 Error Handling Strategy

### Graceful Degradation

```
Fish Audio Unavailable
    └─ Mock voice model
    └─ Skip TTS generation
    └─ Return text only

Claude API Error
    └─ Use fallback templates
    └─ Basic personality model
    └─ Simple responses

ChromaDB Down
    └─ Use database-only storage
    └─ Basic text search
    └─ Limited memory recall

All APIs Down
    └─ Basic chat functionality
    └─ No voice generation
    └─ Local memory only
```

---

## 🚀 Deployment Architecture

### Development
```
localhost:3000
    ├─ Next.js Dev Server
    ├─ SQLite Database (file)
    ├─ Local File Storage
    └─ ChromaDB (optional, Docker)
```

### Production (Vercel)
```
vercel.app
    ├─ Next.js (Edge Functions)
    ├─ PostgreSQL (Vercel/Supabase)
    ├─ Vercel Blob Storage
    └─ ChromaDB (Cloud/Self-hosted)
```

---

## 📈 Scalability Considerations

### Current Limits
- Single user per session (no auth)
- Local file storage (ephemeral on Vercel)
- SQLite (not concurrent-safe at scale)

### Scaling Strategy
```
Phase 1 (MVP - Current)
    └─ Single instance, local storage

Phase 2 (100 users)
    ├─ Add authentication
    ├─ PostgreSQL
    └─ Cloud storage (S3)

Phase 3 (1,000 users)
    ├─ Redis caching
    ├─ CDN for assets
    └─ Background job queue

Phase 4 (10,000+ users)
    ├─ Load balancing
    ├─ Microservices
    ├─ Horizontal scaling
    └─ Multi-region deployment
```

---

**Built for Cal Hacks 12.0**


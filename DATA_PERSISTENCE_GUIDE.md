# 📊 Data Persistence Guide - What Gets Saved Per User

## Overview

**All data is saved in Supabase PostgreSQL database** and associated with the user's Supabase Auth ID. When a user logs in, all their data is automatically loaded.

---

## ✅ What's Currently Being Saved

### 1. **Recording Data (Audio)** 
**Saved:** ✅ Yes  
**Table:** `User.audioUrl`  
**When:** After user records their voice  
**Location:** Uploaded to cloud storage (or `/public/uploads/`)  
**API:** `POST /api/create-user`

```typescript
// Saved automatically after recording
{
  audioUrl: "/uploads/{userId}/recording.webm"
}
```

---

### 2. **Chat History (Conversations)**
**Saved:** ✅ Yes  
**Table:** `Conversation`  
**When:** Every message in chat  
**API:** `POST /api/speak`

```typescript
// Each message saved as:
{
  id: "conv_123",
  userId: "user-uuid",
  role: "user" | "assistant",
  content: "Hey, how are you?",
  audioUrl: "/uploads/{userId}/response-{timestamp}.mp3", // For AI responses
  createdAt: "2025-10-26T..."
}
```

**Includes:**
- User messages
- AI clone responses (text)
- AI response audio files

---

### 3. **Context from Stories (Memories)**
**Saved:** ✅ Yes  
**Table:** `Memory`  
**When:** User provides stories, habits, reactions  
**APIs:** `POST /api/upload`, `POST /api/update-user`, `POST /api/speak`

```typescript
// Each piece of context saved as:
{
  id: "mem_123",
  userId: "user-uuid",
  content: "I love hiking on weekends...",
  category: "stories" | "habits" | "reactions",
  embedding: "chroma_embedding_id", // For vector search
  createdAt: "2025-10-26T..."
}
```

**Categories:**
- `stories` - Personal stories and experiences
- `habits` - Daily routines and behaviors
- `reactions` - How they respond to situations

---

### 4. **Face Photos & 3D Model**
**Saved:** ✅ Yes  
**Table:** `User.photoUrls`, `User.faceData`  
**When:** User uploads photos  
**API:** `POST /api/upload`, `POST /api/update-user`

```typescript
{
  photoUrls: '["photo-0.jpg", "photo-1.jpg", ...]', // JSON string
  faceData: '{
    "contours": [
      { "name": "jawline", "points": [[x,y,z], ...] },
      { "name": "hair_top", "points": [[x,y,z], ...] },
      ...
    ]
  }' // JSON string of 3D face contours
}
```

---

### 5. **AI Models**
**Saved:** ✅ Yes  
**Table:** `User`  
**When:** Voice cloning completes, personality analyzed  
**APIs:** `POST /api/voice-clone`, `POST /api/personality`

```typescript
{
  voiceModelId: "fish_audio_model_123",       // Fish Audio voice clone ID
  personalityData: '{                         // JSON personality model
    "traits": ["friendly", "thoughtful"],
    "communication_style": "casual",
    "tone": "warm",
    "background": "..."
  }',
  chromaCollectionId: "user_{userId}"         // Vector DB collection
}
```

---

## 🆕 Consent Tracking (New!)

I've added consent fields to track user permissions for data usage:

### Schema Update:

```prisma
model User {
  // ... existing fields ...
  
  // Consent (for data usage)
  consentAudio        Boolean @default(false)  // Consent to save audio recordings
  consentChat         Boolean @default(false)  // Consent to save chat history
  consentContext      Boolean @default(false)  // Consent to save stories/context
  consentFaceData     Boolean @default(false)  // Consent to save face photos/3D model
  consentTimestamp    DateTime?               // When consent was given
}
```

### Apply Migration:

```bash
# Generate migration
npx prisma migrate dev --name add_consent_fields

# Or for production
npx prisma migrate deploy
```

### Save Consent in Code:

Add this to your upload/create-user routes:

```typescript
// When user agrees to save data
await prisma.user.update({
  where: { id: authUser.id },
  data: {
    consentAudio: true,
    consentChat: true,
    consentContext: true,
    consentFaceData: true,
    consentTimestamp: new Date()
  }
})
```

---

## 🔍 How to Verify Data is Saved

### 1. Check Database (Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/{your-project}/editor

**Tables to check:**
- `User` - Audio, photos, face data, voice model, personality
- `Memory` - Stories, habits, reactions
- `Conversation` - Chat history

### 2. Check in Code

```typescript
// Get user with all data
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    memories: true,        // All stories/context
    conversations: true    // All chat history
  }
})

console.log('User data:', {
  audio: user.audioUrl,
  photos: JSON.parse(user.photoUrls || '[]'),
  voiceModel: user.voiceModelId,
  personality: JSON.parse(user.personalityData || '{}'),
  faceData: JSON.parse(user.faceData || '{}'),
  memoriesCount: user.memories.length,
  conversationsCount: user.conversations.length
})
```

### 3. Test User Journey

1. **Sign up** → User record created in Supabase
2. **Record voice** → `audioUrl` saved
3. **Upload photos** → `photoUrls` saved, `faceData` generated
4. **Add context** → `Memory` records created (stories, habits, reactions)
5. **Start chat** → `Conversation` records created for each message
6. **Log out and log back in** → All data still there! ✅

---

## 📝 Data Associated with Each User

Every piece of data is tied to the user's **Supabase Auth ID**:

```typescript
// All queries use the authenticated user's ID
const { data: { user: authUser } } = await supabase.auth.getUser()
const userId = authUser.id  // UUID from Supabase Auth

// All data operations use this ID
await prisma.user.findUnique({ where: { id: userId } })
await prisma.memory.findMany({ where: { userId } })
await prisma.conversation.findMany({ where: { userId } })
```

---

## 🚀 What Happens on Login

When a user logs in (Supabase Auth):

1. **Frontend:** `useAuth()` hook gets Supabase session
2. **Backend:** All API routes check `supabase.auth.getUser()`
3. **Database:** All queries filter by `userId`
4. **Result:** User sees their own data only!

---

## 🛡️ Data Privacy & Consent

### Before Saving Data:

1. **Show consent dialog** (you'll implement this UI)
2. **Get explicit agreement** for each type:
   - ✅ Audio recordings
   - ✅ Chat history
   - ✅ Personal stories/context
   - ✅ Face photos/3D model
3. **Save consent** in database
4. **Only save data** if consent is true

### Respecting Consent in Code:

```typescript
// Check consent before saving
const user = await prisma.user.findUnique({ where: { id: userId } })

// Save chat only if consented
if (user.consentChat) {
  await prisma.conversation.create({
    data: { userId, role: 'user', content: message }
  })
}

// Save context only if consented
if (user.consentContext) {
  await prisma.memory.create({
    data: { userId, content: story, category: 'stories' }
  })
}
```

---

## 📋 Checklist for You

- [ ] Run migration: `npx prisma migrate dev --name add_consent_fields`
- [ ] Push migration to Supabase: `npx prisma migrate deploy` (or it auto-syncs)
- [ ] Add consent dialog UI (show before data collection)
- [ ] Update create-user/upload routes to save consent
- [ ] Add consent checks before saving sensitive data
- [ ] Test: Create user → Add data → Log out → Log in → Verify data persists

---

## Summary

| Data Type | Saved? | Table | Consent Field |
|-----------|--------|-------|---------------|
| Audio Recording | ✅ | `User.audioUrl` | `consentAudio` |
| Chat History | ✅ | `Conversation` | `consentChat` |
| Stories/Context | ✅ | `Memory` | `consentContext` |
| Face Photos | ✅ | `User.photoUrls` | `consentFaceData` |
| 3D Face Model | ✅ | `User.faceData` | `consentFaceData` |
| Voice Model | ✅ | `User.voiceModelId` | `consentAudio` |
| Personality | ✅ | `User.personalityData` | `consentContext` |

**Everything is already being saved per user! 🎉**

Now just add the consent UI and run the migration!


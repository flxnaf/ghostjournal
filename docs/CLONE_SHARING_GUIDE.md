# Clone Sharing & Download Guide

## 🎯 Overview

Replik allows users to share their AI clones with friends, who can then download them for use in Minecraft as NPCs.

---

## 📥 Download Clone Feature

### What It Does:
When you download someone's clone, you get a JSON file with:

```json
{
  "userId": "abc-123",
  "username": "techie_sam",
  "voiceModelId": "fish-model-xyz",  // Fish Audio reference key
  "context": {
    "entries": [
      { "category": "story", "content": "..." },
      { "category": "habit", "content": "..." }
    ]
  },
  "faceData": { ... },  // 3D face model
  "minecraftIntegration": {
    "apiUrl": "https://your-app.railway.app/api/speak"
  }
}
```

### Purpose:
- **Minecraft mod integration**: Import friends as NPCs
- **Portable**: Take the clone anywhere
- **Privacy-safe**: Only includes `voiceModelId` (not raw audio)
- **Functional**: NPCs can talk with your friend's voice via Fish Audio API

### How to Download:
1. Go to **Dashboard** → **"Browse Clone Models"**
2. Search for a friend's username
3. Click **"📥 Download for Minecraft"**
4. Save the `username_clone.json` file

---

## 🌐 Public/Private Visibility

### Default: 🔒 Private
- New clones are **private by default**
- Only you can access your clone
- Not searchable in browse page

### Making Public: 🌐
1. Go to **Dashboard**
2. Click **"Make Public"** button
3. Your clone is now searchable!

### What Happens When Public:
- ✅ Appears in **"Browse Clone Models"**
- ✅ Searchable by username/name/bio
- ✅ Others can **chat** with your clone online
- ✅ Others can **download** your clone for Minecraft
- ✅ Your `voiceModelId` is accessible (safe - just a reference key)
- ❌ Raw voice recordings are **already deleted** (privacy-protected)

---

## 🔒 Privacy Details

### What's Shared When Public:
- ✅ Username, name, bio
- ✅ Personality context (stories, habits, reactions)
- ✅ `voiceModelId` (reference to Fish Audio model)
- ✅ Face data (3D model)

### What's NOT Shared:
- ❌ Raw voice recordings (deleted after training)
- ❌ Email address
- ❌ Private chat history
- ❌ The actual voice model file (stored by Fish Audio, accessed via API)

### Key Point:
**The `voiceModelId` is just a reference string.** It's like a key that tells Fish Audio which voice to use. The actual voice model is:
- Hosted by Fish Audio (not in your database)
- Accessible via API (requires your `FISH_AUDIO_API_KEY`)
- Cannot be downloaded or reconstructed into the original audio

---

## 🎮 Minecraft Integration Flow

### For Clone Owners:
```
1. Create your clone → Record voice, add personality
2. Toggle "Make Public" → Clone becomes searchable
3. Share your username → Friends can find you
```

### For Minecraft Players:
```
1. Browse clones → Search for friend's username
2. Download clone JSON → Saves locally
3. Place JSON in Minecraft mod folder
4. Spawn friend as NPC → Use spawn egg in creative mode
5. Right-click NPC → Chat with friend's clone!
```

---

## 🔍 Browse Clones Feature

### How It Works:
- **GET `/api/clones`**: Fetches all users where `isPublic = true`
- **Search**: Filters by username, name, or bio
- **Results**: Sorted by creation date (newest first)
- **Limit**: 50 results max

### What You See:
```
┌────────────────────────────┐
│ 👤 Sam Chen (@techie_sam)  │
│ Software engineer who loves │
│ AI and gaming              │
│                            │
│ [💬 Chat] [📥 Download]    │
└────────────────────────────┘
```

---

## 🚀 API Endpoints

### 1. List Public Clones
```http
GET /api/clones?search=sam
```

**Response:**
```json
{
  "clones": [
    {
      "userId": "abc-123",
      "username": "techie_sam",
      "name": "Sam Chen",
      "bio": "Software engineer who loves AI and gaming",
      "createdAt": "2025-01-26T10:30:00Z",
      "isPublic": true,
      "hasVoiceModel": true
    }
  ]
}
```

### 2. Toggle Public Status
```http
POST /api/toggle-public
Content-Type: application/json

{
  "userId": "abc-123",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "isPublic": true
}
```

### 3. Download Clone Data
```http
GET /api/personality?userId=abc-123
```

**Response:**
```json
{
  "personalityData": "{ ... }",
  "voiceModelId": "fish-model-xyz",
  "faceData": "{ ... }",
  "name": "Sam Chen",
  "email": null,  // Not exposed
  "createdAt": "2025-01-26T10:30:00Z"
}
```

---

## 🛡️ Security Considerations

### Safe to Share:
- ✅ `voiceModelId`: Just a reference key, cannot reconstruct audio
- ✅ Personality context: Public by nature when publishing
- ✅ Face data: 3D model, not actual photos

### Protected:
- 🔒 Raw voice recordings: Deleted after training
- 🔒 Email addresses: Never exposed in public listings
- 🔒 Private clones: Not accessible via API
- 🔒 Fish Audio API key: Server-side only

### Best Practices:
1. **Don't include sensitive info in bio/personality** (e.g., phone numbers, addresses)
2. **Make private if you change your mind** (toggle at any time)
3. **Review your context** before making public
4. **Remember**: Once downloaded, friends have a copy (like sharing any file)

---

## ❓ FAQ

### Q: Can I make my clone private again after making it public?
**A:** Yes! Just click "Make Private" on the Dashboard. It will disappear from search immediately.

### Q: Can people hear my original voice recording?
**A:** No! The raw audio is deleted after training. Only the `voiceModelId` (reference key) exists.

### Q: What if I delete my account?
**A:** Your clone disappears from search immediately. However, anyone who already downloaded your JSON file will still have that copy (like sharing any file).

### Q: Can people use my clone without my permission?
**A:** Only if you make it public. Private clones are not accessible to anyone but you.

### Q: Does Fish Audio charge for API calls when others use my voice?
**A:** Your Replik deployment's `FISH_AUDIO_API_KEY` is used, so costs come from your account. Consider rate limiting for production.

### Q: Can I see who downloaded my clone?
**A:** Not currently implemented. Downloads are anonymous (just like downloading any public file).

---

## 🎓 Example Use Case

### Scenario: Gaming with Friends

**Sarah wants her friends to have her clone as an NPC:**

1. **Sarah creates her clone** on Replik:
   - Records voice: "I love building castles..."
   - Adds personality: "I'm creative, patient, loves architecture"
   - Uploads photo for 3D model

2. **Sarah makes it public**:
   - Goes to Dashboard
   - Clicks "Make Public"
   - Clone appears in browse

3. **Her friend Mike searches**:
   - Opens "Browse Clone Models"
   - Searches "@sarah_builds"
   - Finds her clone

4. **Mike downloads the JSON**:
   - Clicks "Download for Minecraft"
   - Saves `sarah_builds_clone.json`

5. **Mike imports to Minecraft**:
   - Places JSON in mod folder
   - Gets spawn egg in creative mode
   - Spawns Sarah's NPC

6. **In-game interaction**:
   ```
   Mike: @sarah what should I build?
   Sarah's Clone: Ooh, how about a floating castle? 
                  Use lots of quartz and glass!
   ```

Now Sarah's personality and voice are in Mike's Minecraft world! 🎮

---

## 🚀 Next Steps

1. **Create your clone** (Dashboard → "My Clone Model")
2. **Decide on visibility** (Private by default)
3. **If sharing**: Toggle "Make Public"
4. **Tell friends your username** (e.g., @techie_sam)
5. **They can download & import** to Minecraft!

---

**Built with:** Replik (Next.js + Supabase + Claude + Fish Audio)  
**For:** Clone sharing, Minecraft NPC import, and digital immortality 🚀


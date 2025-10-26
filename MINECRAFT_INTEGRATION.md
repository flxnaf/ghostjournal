# 🎮 Minecraft Integration - Complete Guide

## Overview

You can now interact with digital twins from your web app directly in Minecraft! This MVP implementation allows text-based conversations with AI twins in-game.

---

## 🌐 Web App Components

### 1. Export API

**Endpoint:** `GET /api/minecraft/export/[userId]`

**Returns:**
```json
{
  "twin_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Alex",
  "display_name": "Alex Chen",
  "api_endpoint": "https://yourapp.com/api/speak",
  "created_at": "2025-10-25T10:00:00Z"
}
```

**Usage:** Share this URL with Minecraft players

### 2. Minecraft Integration Page

**Route:** `/minecraft`

**Features:**
- Display user's Twin ID
- Show export URL
- Download JSON button
- Setup instructions
- Command examples

---

## 🎮 Minecraft Mod

### Installation (For Players)

1. **Install Fabric Loader**
   - Download from: https://fabricmc.net/use/
   - Version: 1.20.1

2. **Install Required Mods** (place in `.minecraft/mods/`)
   - Fabric API: https://modrinth.com/mod/fabric-api
   - Fabric Language Kotlin: https://modrinth.com/mod/fabric-language-kotlin
   - Digital Twins Mod: `digitaltwins-1.0.0.jar`

3. **Launch Minecraft**

### Commands

#### `/twinimport <url-or-path>`
Import a digital twin.

**Examples:**
```
/twinimport https://yourapp.com/api/minecraft/export/user-id-123
/twinimport C:/Users/You/Downloads/twin-alex.json
```

#### `/twinlist`
Show all imported twins.

**Output:**
```
=== Imported Twins ===
- Alex Chen (Spawned)
- Jordan Lee (Not spawned)
```

#### `/twinspawn <name>`
Spawn a twin NPC.

**Example:**
```
/twinspawn Alex
```

**Result:** Armor stand appears at your location with "Alex Chen" nametag

#### `/twin <name> <message>`
Chat with a spawned twin.

**Example:**
```
/twin Alex Hey, what's your favorite food?
```

**Response (after 3-5 seconds):**
```
[Alex Chen] Oh man, spicy ramen for sure!
```

#### `/twinremove <name>`
Despawn a twin NPC.

**Example:**
```
/twinremove Alex
```

---

## 🔧 Building the Mod

### For Developers

```bash
cd minecraft-mod
./gradlew build
```

Output: `build/libs/digitaltwins-1.0.0.jar`

See `minecraft-mod/BUILDING.md` for details.

---

## 🎯 Complete User Flow

### Setup (One-time)

1. **User creates digital twin on web app**
   - Records voice
   - Takes photos
   - Shares personality

2. **User goes to `/minecraft` page**
   - Sees Twin ID
   - Copies export URL or downloads JSON

3. **Player installs Minecraft mod**
   - Installs Fabric + required mods
   - Places Digital Twins mod in mods folder

### In-Game Usage

1. **Import twin:**
   ```
   /twinimport https://yourapp.com/api/minecraft/export/abc123
   ```
   Result: `✓ Loaded twin: Alex Chen`

2. **Spawn twin:**
   ```
   /twinspawn Alex
   ```
   Result: NPC appears

3. **Chat with twin:**
   ```
   /twin Alex What's your favorite memory?
   ```
   Result: `[Alex Chen] Definitely that sunset hike in 2024!`

### How It Works Behind the Scenes

```
Player types command
    ↓
Mod sends HTTP POST to /api/speak
    ↓
Your backend:
  - Loads personality from database
  - Queries memories (ChromaDB)
  - Claude generates response
  - (Fish Audio generates voice - not used in Minecraft MVP)
    ↓
Returns: { "responseText": "..." }
    ↓
Mod displays in chat
```

---

## 🐛 Troubleshooting

### "Twin not found"
- Run `/twinimport` first to download twin data

### "Connection failed" / "Timeout"
- Check internet connection
- Verify API endpoint is accessible
- Check if backend is running

### "Failed to get response"
- Backend API might be down
- Check `.env` has all required API keys (Anthropic, Fish Audio)
- Check console/terminal for errors

### Mod doesn't load
- Ensure Fabric Loader 0.15.0+ is installed
- Install Fabric API
- Install Fabric Language Kotlin
- Check `logs/latest.log` for errors

---

## 📊 API Integration Details

### What the Mod Sends

```http
POST https://yourapp.com/api/speak
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Hey, what's your favorite food?"
}
```

### What It Receives

```json
{
  "responseText": "Oh man, spicy ramen for sure!",
  "audioUrl": "https://supabase.../audio-xyz.mp3"
}
```

**Note:** MVP only uses `responseText`. Audio support coming in future versions.

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Voice playback in Minecraft (Fish Audio integration)
- [ ] Custom NPC models (not just armor stands)
- [ ] Walking/following behavior
- [ ] Gestures/animations while talking
- [ ] Offline mode with cached responses
- [ ] Multiple twins in one world
- [ ] Friend's twins (social features)

### Easy Additions

- **Authentication:** Add API keys for security
- **Rate Limiting:** Prevent spam
- **Caching:** Store recent responses offline
- **UI Improvements:** Better chat formatting

---

## 📁 Project Structure

```
ghostjournal/
├── app/
│   ├── api/minecraft/export/[userId]/route.ts  ← Export API
│   └── minecraft/page.tsx                       ← Minecraft page
└── minecraft-mod/
    ├── build.gradle.kts                         ← Build config
    ├── src/main/kotlin/com/digitaltwins/
    │   ├── DigitalTwinsMod.kt                   ← Main class
    │   ├── TwinCommands.kt                      ← Commands
    │   ├── TwinAPI.kt                           ← HTTP client
    │   ├── TwinNPC.kt                           ← NPC management
    │   └── TwinStorage.kt                       ← Data storage
    ├── BUILDING.md                              ← Build guide
    └── README.md                                ← User guide
```

---

## ⏱️ Performance

- **Response Time:** 3-5 seconds average
  - 500ms: HTTP request
  - 2-3s: Claude API
  - 500ms: Response processing

- **Rate Limiting:** None (add if needed)
- **Caching:** None in MVP (add for offline mode)

---

## 🎓 Technical Details

### Technologies Used

**Web App:**
- Next.js 14
- TypeScript
- Prisma (PostgreSQL/Supabase)
- Fish Audio API
- Anthropic Claude API

**Minecraft Mod:**
- Fabric 1.20.1
- Kotlin
- OkHttp (HTTP client)
- Gson (JSON parsing)
- Kotlin Coroutines (async operations)

### Why These Choices

- **Fabric over Forge:** Lighter, faster, easier to develop
- **Kotlin over Java:** More concise, better async support
- **Armor Stands:** Simplest NPC implementation
- **Text-only MVP:** Avoid audio complexity in Minecraft

---

## 🎉 Demo Script

**Perfect for showing judges:**

1. **Show web app:**
   - "I created my digital twin with my voice and personality"
   - Navigate to `/minecraft` page
   - "Here's my Twin ID and export link"

2. **Switch to Minecraft:**
   - `/twinimport [URL]`
   - "Downloaded my twin's personality"
   - `/twinspawn Alex`
   - "Now my twin exists in Minecraft!"

3. **Live conversation:**
   - `/twin Alex What's your favorite food?`
   - [Wait 3-5 seconds]
   - Response appears: "Oh man, spicy ramen for sure!"
   - **Judges amazed** 🤯

4. **Explain:**
   - "It's using the same personality model and memories"
   - "Powered by Claude AI in real-time"
   - "Could add voice, multiple players, social features"

---

## 📝 License

MIT License - See main repository

---

## 🙏 Credits

Built for Cal Hacks 12.0
- Web App: Your team
- Minecraft Integration: Your team
- AI APIs: Anthropic Claude, Fish Audio

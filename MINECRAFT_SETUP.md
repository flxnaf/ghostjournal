# 🎮 Minecraft Integration Guide

## Overview

The EchoSelf Minecraft mod brings your digital twins into Minecraft with **two modes**:

1. **MVP Mode** - Command-based with voice playback ✅ **IMPLEMENTED**
2. **Advanced Mode** - GUI-based with custom entities 🚧 **IN DEVELOPMENT**

Both modes feature full voice playback using Fish Audio TTS!

---

## 🚀 Quick Start

### Prerequisites

- **Minecraft 1.20.1**
- **Fabric Loader 0.15.0+** - [Download](https://fabricmc.net/use/)
- **Fabric API** - [Download](https://modrinth.com/mod/fabric-api)
- **Fabric Language Kotlin** - [Download](https://modrinth.com/mod/fabric-language-kotlin)
- **Java 17+**

### Installation

1. **Build the mod:**
   ```bash
   cd minecraft-mod
   ./gradlew build
   ```

2. **Install:**
   - Copy `build/libs/digitaltwins-1.0.0.jar` to `.minecraft/mods/`
   - Launch Minecraft 1.20.1 with Fabric

3. **Start your web app:**
   ```bash
   npm run dev
   ```

---

## 📋 MVP Mode (Commands + Voice)

### Commands

#### `/twinimport <url>`
Import a digital twin from your web app.

**Example:**
```
/twinimport http://localhost:3000/api/minecraft/export/YOUR_USER_ID
```

**Result:** `✓ Loaded twin: Alex Chen`

#### `/twinlist`
List all imported twins.

**Output:**
```
=== Imported Twins ===
- Alex Chen (Spawned)
- Maya Rodriguez (Not spawned)
```

#### `/twinspawn <name>`
Spawn a twin NPC (armor stand).

**Example:**
```
/twinspawn Alex
```

**Result:** Armor stand appears with "Alex Chen" name tag

#### `/twin <name> <message>`
Chat with a twin and hear their voice!

**Example:**
```
/twin Alex What's your favorite food?
```

**What happens:**
1. Message sent to API (3-5 second wait)
2. Text response appears: `[Alex Chen] Oh man, spicy ramen for sure!`
3. 🔊 **Voice plays through speakers!**

#### `/twinremove <name>`
Despawn a twin NPC.

---

## 🎯 Advanced Mode (GUI + Custom Entities)

### Features

- **Custom Entities** - Real mobs (not armor stands) with AI
- **Spawn Eggs** - One egg per twin in creative menu
- **Custom GUI** - Minecraft-style chat interface
- **Player Model** - Twins look like players
- **AI Behavior** - Walks around, looks at you

### How to Use

1. **Get spawn egg:**
   - Open creative inventory
   - Search for "Alex Clone Spawn Egg"

2. **Spawn twin:**
   - Right-click ground with egg
   - Custom NPC appears

3. **Chat:**
   - Right-click NPC
   - GUI opens
   - Type message, press Enter
   - 🔊 Voice response plays!

---

## 🔊 Voice Playback

Both modes feature full voice synthesis:

```
You: "What's your favorite food?"
   ↓
API Call → /api/speak
   ↓
Claude generates response
   ↓
Fish Audio generates voice
   ↓
Response: {
  "text": "Oh man, spicy ramen for sure!",
  "audioUrl": "/uploads/.../response.mp3"
}
   ↓
🔊 MP3 plays in Minecraft!
```

---

## 🛠️ Building from Source

```bash
cd minecraft-mod

# Clean build
./gradlew clean build

# Run client (for testing)
./gradlew runClient

# Output JAR
ls build/libs/digitaltwins-1.0.0.jar
```

---

## 🐛 Troubleshooting

### "Twin not found"
**Solution:** Run `/twinimport <url>` first

### "Connection failed"
**Solution:**
- Check internet connection
- Verify web app is running: `npm run dev`
- Test API: `curl http://localhost:3000/api/minecraft/export/YOUR_USER_ID`

### "Audio playback failed"
**Possible causes:**
- MP3 codec missing (should be bundled)
- Invalid audio URL
- No audio output device

**Fix:** Check console logs in `.minecraft/logs/latest.log`

### Mod doesn't load
**Solution:**
- Ensure Fabric Loader 0.15.0+ installed
- Install Fabric API
- Install Fabric Language Kotlin
- Check logs: `.minecraft/logs/latest.log`

---

## 📊 API Endpoints

### Export API
**GET** `/api/minecraft/export/[userId]`

**Response:**
```json
{
  "twin_id": "abc-123",
  "name": "Alex",
  "display_name": "Alex Chen",
  "api_endpoint": "https://yourapp.com/api/speak",
  "created_at": "2025-10-26T00:00:00Z"
}
```

### Speak API
**POST** `/api/speak`

**Request:**
```json
{
  "userId": "abc-123",
  "message": "Hey, how are you?"
}
```

**Response:**
```json
{
  "text": "Pretty good! Working on a new project.",
  "audioUrl": "/uploads/abc-123/response_456.mp3",
  "success": true
}
```

---

## 🎓 Technical Details

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Fabric 1.20.1 |
| Language | Kotlin 1.9.0 |
| HTTP Client | OkHttp 4.12.0 |
| JSON | Gson 2.10.1 |
| Async | Kotlin Coroutines 1.7.3 |
| Audio | MP3SPI 1.9.5.4 + JLayer 1.0.1.4 |

### File Structure

```
minecraft-mod/
├── src/main/kotlin/com/digitaltwins/
│   ├── DigitalTwinsMod.kt       ← Main entry point
│   ├── TwinAPI.kt               ← HTTP client
│   ├── TwinAudioPlayer.kt       ← Voice playback
│   ├── TwinCommands.kt          ← MVP commands
│   ├── TwinNPC.kt               ← MVP NPCs (armor stands)
│   ├── TwinStorage.kt           ← Local storage
│   └── advanced/                ← Advanced mode (in development)
│       ├── entity/              ← Custom entities
│       ├── item/                ← Spawn eggs
│       ├── client/              ← GUI + rendering
│       └── network/             ← Packets
├── src/main/resources/
│   └── fabric.mod.json          ← Mod metadata
├── build.gradle.kts             ← Build config
└── README.md                    ← Full documentation
```

---

## 🎉 Demo for Cal Hacks

### Perfect Demo Flow

1. **Web App** (30 seconds)
   - "I created my digital twin with my voice"
   - Show `/minecraft` page
   - Copy export URL

2. **Minecraft** (2 minutes)
   - `/twinimport https://...`
   - "Downloaded personality and voice model"
   - `/twinspawn Alex`
   - NPC appears

3. **The Magic** (1 minute)
   - `/twin Alex What's your favorite food?`
   - Wait 3-5 seconds...
   - **Text + VOICE response!** 🔊
   - "That's my actual voice, cloned with AI!"

4. **Explain Tech** (1 minute)
   - "Claude AI for personality"
   - "Fish Audio for voice cloning"
   - "Real-time integration"

**Judge reaction: 🤯**

---

## 📝 What's Next

### Planned Features
- ✅ Voice playback - **DONE!**
- 🚧 Custom entities - **In progress**
- 🚧 GUI chat screen - **In progress**
- 🚧 Spawn eggs - **In progress**
- ⏳ Multiple players - **Planned**
- ⏳ Offline caching - **Planned**

---

## 🙏 Credits

- **Fabric** - Mod framework
- **Kotlin** - Programming language
- **Anthropic Claude** - AI personality
- **Fish Audio** - Voice cloning

Built for **Cal Hacks 12.0** 🚀

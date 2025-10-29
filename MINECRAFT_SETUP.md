# Minecraft Integration Guide

## Overview

The EchoSelf Minecraft mod brings your digital twins into Minecraft with **two modes**:

1. **MVP Mode** - Command-based with voice playback (IMPLEMENTED)
2. **Advanced Mode** - GUI-based with custom entities (IN DEVELOPMENT)

Both modes feature full voice playback using Fish Audio TTS.

---

## Quick Start

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

## MVP Mode (Commands + Voice)

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
3. **Voice plays through speakers!**

#### `/twinremove <name>`
Despawn a twin NPC.

---

## Advanced Mode (GUI + Custom Entities)

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
   - Voice response plays!

---

## Voice Playback

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
MP3 plays in Minecraft!
```

---

## Building from Source

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

## Troubleshooting

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

## API Endpoints

### Export API (Web App)
**Download Clone JSON** - Two ways to export your clone data:
1. Visit the **Minecraft Integration page** (`/minecraft`) and click "Download Twin Data" button
2. Use the "Export JSON" button in the **Build Context** tab of the main app

**Downloaded File:** `twin-username.json` or `username_clone.json`

**Structure:**
```json
{
  "userId": "b9f8b510-a463-4232-9490-9679300453c1",
  "exportDate": "2025-10-26T12:34:56.789Z",
  
  "context": {
    "entries": [
      {
        "category": "story",
        "content": "I love spicy ramen and coding",
        "timestamp": "2025-10-26T12:00:00.000Z"
      }
    ],
    "totalEntries": 5,
    "categories": ["story", "habit", "preference"]
  },
  
  "audioData": {
    "audioUrl": null,
    "voiceModelId": "d7dfbedf1d39421a948a302839a86ba9",
    "voiceModelProvider": "fish-audio",
    "usage": {
      "description": "Use voiceModelId to make Fish Audio API calls",
      "apiEndpoint": "https://api.fish.audio/v1/tts",
      "requiredFields": ["text", "reference_id (voiceModelId)", "format"]
    }
  },
  
  "faceData": { ... },
  
  "metadata": {
    "name": "Alex Chen",
    "username": "alexc",
    "email": "alex@example.com",
    "createdAt": "2025-10-25T00:00:00.000Z",
    "minecraftIntegration": {
      "howToUse": "See MINECRAFT_INTEGRATION.md in the Replik repo",
      "apiUrl": "https://replik.tech/api/speak",
      "requiresInternet": true
    }
  }
}
```

### Key Fields for Minecraft:

1. **`userId`** - Use this for API calls to `/api/speak`
2. **`voiceModelId`** - Use this for direct Fish Audio TTS calls
3. **`context.entries`** - The clone's personality data
4. **`metadata.apiUrl`** - Where to send chat messages

### Speak API (For Chat)
**POST** `/api/speak`

**Request:**
```json
{
  "userId": "b9f8b510-a463-4232-9490-9679300453c1",
  "message": "Hey, how are you?"
}
```

**Response:**
```json
{
  "text": "Pretty good! Working on a new project.",
  "audioUrl": "https://ehxprwfkqnoxsvxljksz.supabase.co/storage/v1/object/public/audio-recordings/abc-123/response_456.mp3",
  "success": true
}
```

**Important:** This endpoint uses the clone's personality + Fish Audio voice model automatically!

---

## Fish Audio API Integration

### Option 1: Use Replik's `/api/speak` Endpoint (Recommended)
This is the easiest way - just send the `userId` and the API handles everything:
- Fetches personality context
- Generates AI response with Claude
- Synthesizes voice with Fish Audio
- Returns text + audio URL

**Example:**
```kotlin
val response = httpClient.post("https://replik.tech/api/speak") {
    contentType(ContentType.Application.Json)
    setBody("""{"userId":"$userId","message":"$message"}""")
}
// Response includes audioUrl ready to play!
```

### Option 2: Direct Fish Audio API Calls (Advanced)
If you want to generate voice for custom text (not AI responses):

**Endpoint:** `https://api.fish.audio/v1/tts`

**Headers:**
```
Authorization: Bearer YOUR_FISH_AUDIO_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hello from Minecraft!",
  "reference_id": "d7dfbedf1d39421a948a302839a86ba9",
  "format": "mp3",
  "mp3_bitrate": 128,
  "opus_bitrate": -1000,
  "latency": "normal"
}
```

**Parameters:**
- `text` - The text to speak
- `reference_id` - The `voiceModelId` from your clone's JSON
- `format` - Audio format (`mp3`, `wav`, `opus`, `flac`)
- `latency` - `normal` or `balanced` (normal = better quality)

**Response:**
Binary audio data (MP3 file)

**Example (Kotlin):**
```kotlin
val voiceModelId = "d7dfbedf1d39421a948a302839a86ba9" // From clone JSON

val response = httpClient.post("https://api.fish.audio/v1/tts") {
    header("Authorization", "Bearer ${System.getenv("FISH_AUDIO_API_KEY")}")
    contentType(ContentType.Application.Json)
    setBody("""{
        "text": "Hello from Minecraft!",
        "reference_id": "$voiceModelId",
        "format": "mp3",
        "latency": "normal"
    }""")
}

val audioBytes = response.readBytes()
// Save to file or play directly
```

### Where to Get Your Fish Audio API Key

1. Go to [https://fish.audio](https://fish.audio)
2. Sign up / log in
3. Navigate to API section
4. Generate an API key
5. Add to your environment: `export FISH_AUDIO_API_KEY=your_key_here`

### Which Option Should You Use?

| Use Case | Recommended Approach |
|----------|---------------------|
| Chat with AI clone | `/api/speak` endpoint |
| Custom voice lines | Direct Fish Audio API |
| Testing voice quality | Direct Fish Audio API |
| Full clone experience | `/api/speak` endpoint |

---

## Technical Details

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


## What's Next

### Planned Features
- Voice playback - **DONE!**
- Custom entities - **In progress**
- GUI chat screen - **In progress**
- Spawn eggs - **In progress**
- Multiple players - **Planned**
- Offline caching - **Planned**

---

## Credits

- **Fabric** - Mod framework
- **Kotlin** - Programming language
- **Anthropic Claude** - AI personality
- **Fish Audio** - Voice cloning

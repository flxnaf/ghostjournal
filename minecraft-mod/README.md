# Digital Twins Minecraft Mod (MVP + Voice)

**Interact with AI digital twins in Minecraft with full voice support!**

## Features

✅ Text-based chat with digital twins
✅ **Voice playback** (Fish Audio TTS)
✅ Import twins from web app API
✅ Spawn twins as NPCs (armor stands)
✅ Persistent twin storage

## Installation

### Prerequisites

1. **Minecraft 1.20.1** with **Fabric Loader 0.15.0+**
2. **Fabric API** - [Download](https://modrinth.com/mod/fabric-api)
3. **Fabric Language Kotlin** - [Download](https://modrinth.com/mod/fabric-language-kotlin)
4. **Java 17+**

### Build the Mod

```bash
cd minecraft-mod
./gradlew build
```

Output: `build/libs/digitaltwins-1.0.0.jar`

### Install

1. Copy `digitaltwins-1.0.0.jar` to `.minecraft/mods/`
2. Launch Minecraft with Fabric

## Usage

### 1. Import a Digital Twin

```
/twinimport https://your-app.com/api/minecraft/export/user-123
```

**What it does:**
- Downloads twin data (name, personality, voice model ID)
- Stores locally in `.minecraft/config/digitaltwins/twins.json`

### 2. List Imported Twins

```
/twinlist
```

**Output:**
```
=== Imported Twins ===
- Alex Chen (Not spawned)
- Maya Rodriguez (Spawned)
```

### 3. Spawn a Twin NPC

# Digital Twins Minecraft Mod

## MVP Implementation - Text-based Twin Interaction

This mod allows you to spawn and interact with digital twins from your web app directly in Minecraft.

## Requirements

- Minecraft 1.20.1
- Fabric Loader 0.15.0+
- Fabric API 0.92.0+
- Fabric Language Kotlin 1.10.0+

## Installation

1. Install Fabric Loader for Minecraft 1.20.1
2. Download required mods:
   - Fabric API
   - Fabric Language Kotlin
3. Place the Digital Twins mod JAR in your `.minecraft/mods` folder
4. Launch Minecraft

## Commands

### `/twinimport <url-or-path>`
Import a digital twin from the web app.

**Examples:**
```
/twinimport https://yourapp.com/api/minecraft/export/user-id-here
/twinimport /path/to/twin-data.json
```

### `/twinlist`
List all imported twins.

### `/twinspawn <name>`
Spawn a twin NPC in the world.

**Example:**
```
/twinspawn Alex
```

**Result:**
- Armor stand appears at your location
- Name tag shows "Alex Chen"
- NPC stays in place (no gravity)

### 4. Chat with Twin (+ Voice!)

### `/twin <name> <message>`
Send a message to a spawned twin.

**Example:**
```
/twin Alex Hey, what's your favorite food?
```

**What happens:**
1. Sends message to `/api/speak` endpoint
2. Claude AI generates response based on personality
3. Fish Audio TTS generates voice
4. **Text appears in chat**
5. **🔊 Voice plays through your speakers!**

**Example response:**
```
[Alex Chen] Oh man, spicy ramen for sure!
🔊 Playing voice...
```

### 5. Remove Twin NPC

```
/twinremove Alex
```

## How Voice Playback Works

```
/twin Alex <message>
    ↓
API Call to /api/speak
    {
      "userId": "abc-123",
      "message": "what's your favorite food?"
    }
    ↓
API Response:
    {
      "text": "Oh man, spicy ramen for sure!",
      "audioUrl": "/uploads/user-123/response_456.mp3"
    }
    ↓
TwinAudioPlayer downloads MP3
    ↓
Plays audio through Java Sound API
    ↓
You hear Alex's actual voice! 🔊
```

## Architecture

```
minecraft-mod/
├── src/main/kotlin/com/digitaltwins/
│   ├── DigitalTwinsMod.kt       ← Main mod entry point
│   ├── TwinCommands.kt          ← Chat commands
│   ├── TwinAPI.kt               ← HTTP client for web API
│   ├── TwinStorage.kt           ← Local twin data storage
│   ├── TwinNPC.kt               ← NPC spawning (armor stands)
│   └── TwinAudioPlayer.kt       ← 🆕 Voice playback
├── src/main/resources/
│   └── fabric.mod.json          ← Mod metadata
├── build.gradle.kts             ← Gradle build config
└── settings.gradle.kts          ← Gradle settings
```

## Dependencies

### Minecraft
- Fabric Loader 0.15.0+
- Fabric API 0.92.0+
- Fabric Language Kotlin 1.10.0+

### Libraries (bundled in JAR)
- OkHttp 4.12.0 (HTTP client)
- Gson 2.10.1 (JSON parsing)
- Kotlin Coroutines 1.7.3 (async operations)
- **MP3SPI 1.9.5.4** (MP3 audio support) 🆕
- **JLayer 1.0.1.4** (MP3 decoding) 🆕

## API Integration

### Export API

**Endpoint:** `GET /api/minecraft/export/[userId]`

**Response:**
```json
{
  "twin_id": "00000000-0000-0000-0000-000000000001",
  "name": "Alex",
  "display_name": "Alex Chen",
  "api_endpoint": "https://your-app.com/api/speak",
  "created_at": "2025-10-26T00:00:00Z"
}
```

### Speak API

**Endpoint:** `POST /api/speak`

**Request:**
```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "message": "Hey, how are you?"
}
```

**Response:**
```json
{
  "text": "Pretty good! Working on a new project.",
  "audioUrl": "/uploads/user-123/response_789.mp3",
  "success": true
}
```

## Troubleshooting

### "Twin not found"
**Solution:** Run `/twinimport <url>` first

### "Connection failed"
**Solution:** Check internet connection and verify API is running

### "Audio playback failed"
**Possible causes:**
- MP3 codec not supported (should work with bundled libraries)
- Audio URL is invalid or unreachable
- No audio output device

**Fix:** Check console logs for detailed error messages

### Mod doesn't load
**Solution:**
- Install Fabric Loader 0.15.0+
- Install Fabric API
- Install Fabric Language Kotlin
- Check `logs/latest.log` for errors

## Performance

- **Response time**: 3-5 seconds (API call + voice generation)
- **Audio playback**: Streams audio, starts playing immediately
- **Memory usage**: ~50MB (mod + audio buffers)
- **Network:** ~100KB per response (text + MP3 audio)

## Development

### Build Commands

```bash
# Clean build
./gradlew clean build

# Run client (for testing)
./gradlew runClient

# Refresh dependencies
./gradlew --refresh-dependencies
```

### Adding Features

The mod is designed for easy extension:
- Custom entities → Replace `TwinNPC.kt`
- GUI screens → Add to `client/` package
- More commands → Extend `TwinCommands.kt`

## Demo Script

**For Cal Hacks judges:**

1. **Show web app** - "I created my digital twin with voice and personality"
2. **Import in Minecraft** - `/twinimport https://...`
3. **Spawn NPC** - `/twinspawn Alex` → armor stand appears
4. **Chat** - `/twin Alex What's your favorite food?`
5. **🎤 Voice plays** - "Oh man, spicy ramen for sure!" in Alex's actual voice
6. **Judges amazed** 🤯

## License

MIT License

## Credits

Built for Cal Hacks 12.0
- Fabric mod framework
- Anthropic Claude API (personality)
- Fish Audio API (voice cloning)
The twin will respond based on their personality from the web app!

### `/twinremove <name>`
Despawn a twin NPC.

## How It Works

1. Twin data is imported from your web app
2. When you spawn a twin, an armor stand NPC appears
3. When you send a message, the mod:
   - Sends your message to the web app API
   - Gets a response generated by Claude AI
   - Displays the response in chat
4. Response time: 3-5 seconds (API processing)

## Building from Source

```bash
./gradlew build
```

The JAR will be in `build/libs/`

## Technical Details

- Uses OkHttp for HTTP requests
- Stores twin data in `.minecraft/config/digitaltwins/twins.json`
- NPCs are armor stands with custom name tags
- Text-only for MVP (voice support coming later)

## Troubleshooting

**"Twin not found"**: Run `/twinimport` first
**"Connection failed"**: Check your internet connection
**"Timeout"**: API is slow, try again

## License

MIT License - See main repository

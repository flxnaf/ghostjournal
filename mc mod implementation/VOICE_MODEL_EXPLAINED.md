# Voice Model Training & Export - How It Works

## TL;DR

**What you CAN download:**
- ✅ `voiceModelId` - A reference ID to access your trained voice
- ✅ `audioUrl` - The original training audio you recorded
- ✅ Context/personality data

**What you CANNOT download:**
- ❌ The actual voice model weights/files
- ❌ The trained neural network

**Why?** Fish Audio hosts the model on their servers. You access it via API, not by downloading files.

---

## How Voice Training Works

### Step 1: Recording Audio (Replik)
```
You → Record 10 seconds of audio → Replik saves to Supabase Storage
```

**Saved:**
- `audioUrl`: `https://your-project.supabase.co/storage/v1/object/public/audio-recordings/user_123/audio_456.webm`

---

### Step 2: Train Voice Model (Fish Audio API)
```
Replik → Sends audio to Fish Audio → Fish Audio trains model → Returns voiceModelId
```

**What happens:**
1. Fish Audio receives your audio
2. Trains a custom voice model (S1 model)
3. Stores the model on **their servers**
4. Returns a `voiceModelId` (e.g., `802e3bc2b27e49c2995d23ef70e6ac89`)

**Saved in your database:**
```json
{
  "userId": "abc-123",
  "voiceModelId": "802e3bc2b27e49c2995d23ef70e6ac89",
  "audioUrl": "https://supabase.co/.../audio.webm"
}
```

---

### Step 3: Using Your Voice (Text-to-Speech)
```
Minecraft Mod → Calls Fish Audio API with voiceModelId → Gets audio back
```

**Example API Call:**
```bash
curl -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer YOUR_FISH_API_KEY" \
  -F "text=Hello from Minecraft!" \
  -F "reference_id=802e3bc2b27e49c2995d23ef70e6ac89" \
  -F "format=mp3"
```

**Returns:** MP3 audio file with your voice saying "Hello from Minecraft!"

---

## What Gets Exported in JSON

When you click **"📥 Export JSON"** in Replik, you download:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "exportDate": "2025-01-26T12:00:00Z",
  
  "context": {
    "entries": [
      {
        "category": "story",
        "content": "I love building redstone contraptions",
        "timestamp": "2025-01-26T11:30:00Z"
      }
    ],
    "totalEntries": 1,
    "categories": ["story"]
  },
  
  "audioData": {
    "audioUrl": "https://your-project.supabase.co/storage/.../audio.webm",
    "voiceModelId": "802e3bc2b27e49c2995d23ef70e6ac89",
    "voiceModelProvider": "fish-audio",
    
    "usage": {
      "description": "Use voiceModelId to make Fish Audio API calls",
      "apiEndpoint": "https://api.fish.audio/v1/tts",
      "requiredFields": ["text", "reference_id", "format"],
      "note": "The model is hosted by Fish Audio. Access via API only."
    }
  },
  
  "faceData": {
    "contours": [...],
    "meshData": [...]
  },
  
  "metadata": {
    "name": "YourName",
    "email": "you@example.com",
    "createdAt": "2025-01-26T10:00:00Z",
    
    "minecraftIntegration": {
      "howToUse": "See MINECRAFT_INTEGRATION.md",
      "apiUrl": "http://localhost:3000/api/speak",
      "requiresInternet": true
    }
  }
}
```

---

## How to Use in Minecraft

### Option 1: Direct Fish Audio API (Recommended)

Your Minecraft mod calls Fish Audio directly:

```java
// ReplikAPI.java
public byte[] getVoiceAudio(String text, String voiceModelId) {
    String apiKey = System.getenv("FISH_AUDIO_API_KEY");
    
    MultipartBody formData = new MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart("text", text)
        .addFormDataPart("reference_id", voiceModelId)
        .addFormDataPart("format", "mp3")
        .build();
    
    Request request = new Request.Builder()
        .url("https://api.fish.audio/v1/tts")
        .header("Authorization", "Bearer " + apiKey)
        .post(formData)
        .build();
    
    Response response = httpClient.newCall(request).execute();
    return response.body().bytes(); // MP3 audio
}
```

---

### Option 2: Via Replik API (Easier)

Your Minecraft mod calls your Replik deployment:

```java
// ReplikAPI.java
public CloneResponse getCloneResponse(String message, String voiceModelId) {
    JsonObject body = new JsonObject();
    body.addProperty("userId", voiceModelId); // Use voiceModelId as userId
    body.addProperty("message", message);
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(REPLIK_API_URL + "/api/speak"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
        .build();
    
    HttpResponse<String> response = httpClient.send(request);
    JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
    
    return new CloneResponse(
        json.get("text").getAsString(),
        json.get("audioUrl").getAsString() // Download and play this
    );
}
```

---

## Why You Can't Download the Voice Model

### Technical Explanation:

Fish Audio's voice models are:
1. **Proprietary**: They own the technology
2. **Server-side**: Hosted on their infrastructure
3. **API-only**: Accessed via HTTP requests, not file downloads

### Analogy:

Think of it like Google Translate:
- ❌ You can't download Google's translation engine
- ✅ You CAN use it via their API
- ✅ You CAN save your translations (output)

Same with Fish Audio:
- ❌ You can't download the voice model
- ✅ You CAN use it via their API
- ✅ You CAN save the generated audio (MP3 files)

---

## What About the Original Training Audio?

**You CAN download this!**

The `audioUrl` in your exported JSON points to your original recording:

```bash
# Download your training audio
curl -o training_audio.webm \
  "https://your-project.supabase.co/storage/v1/object/public/audio-recordings/user_123/audio.webm"
```

**Uses:**
- ✅ Backup your voice sample
- ✅ Re-train a different model
- ✅ Reference for voice quality

**But you can't use this directly in Minecraft** - you need the trained model via Fish Audio API.

---

## Cost Considerations

### Fish Audio Pricing:
- **Free Tier**: 10,000 characters/month (≈5,000 TTS calls)
- **Paid**: $0.15 per 1,000 characters

### For Minecraft:
- Average message: 50 characters
- Cost per 1000 messages: ~$0.08
- **Very affordable** for personal use! 🎉

### Free Tier is Enough For:
- ✅ Testing/development
- ✅ Personal gameplay (100+ hours)
- ✅ Small multiplayer server

---

## Alternatives (If You Want Offline Voice)

If you **must** have offline voice (no API calls), you have 2 options:

### Option 1: Pre-generate Common Phrases
```java
// Generate 100 common phrases ahead of time
String[] phrases = {
    "Hello",
    "Good morning",
    "Let's go mining",
    // ... 97 more
};

for (String phrase : phrases) {
    byte[] audio = fishAudioAPI.generate(phrase, voiceModelId);
    saveToFile("audio/phrase_" + i + ".mp3", audio);
}
```

Then play pre-recorded files in-game (no internet needed).

**Pros:**
- ✅ Works offline
- ✅ Instant playback

**Cons:**
- ❌ Limited phrases
- ❌ Not dynamic
- ❌ Large file size (100 MP3s ≈ 10MB)

---

### Option 2: Use Local TTS (Fallback)

If Fish Audio API is unavailable, fall back to Java's built-in TTS:

```java
public void speakText(String text) {
    try {
        // Try Fish Audio first
        byte[] audio = fishAudioAPI.generate(text, voiceModelId);
        playAudio(audio);
    } catch (Exception e) {
        // Fallback to local TTS
        System.out.println("Using local TTS (no custom voice)");
        java.speech.synthesis.Synthesizer synth = new Synthesizer();
        synth.speak(text);
    }
}
```

**Pros:**
- ✅ Always works (offline fallback)

**Cons:**
- ❌ Fallback voice is generic (not your voice)

---

## Summary

### What You Get:

| Item | Where It's Stored | Can Download? | Purpose |
|------|-------------------|---------------|---------|
| **Training Audio** | Supabase Storage | ✅ Yes | Backup, re-training |
| **Voice Model ID** | Database → JSON export | ✅ Yes | API reference key |
| **Voice Model Weights** | Fish Audio servers | ❌ No | N/A (API-only) |
| **Generated Audio** | Temporary (returned by API) | ✅ Yes | Play in Minecraft |
| **Context/Personality** | Database → JSON export | ✅ Yes | Personality prompts |

### Recommended Setup for Minecraft:

1. **Export JSON** from Replik (contains `voiceModelId`)
2. **Read JSON** in Minecraft mod
3. **Call Fish Audio API** with `voiceModelId` for each response
4. **Cache common phrases** (optional, for offline mode)
5. **Fall back to text-only** if API fails

---

## Example: Full Minecraft Flow

```
Player: @clone should I build a castle?
  ↓
Mod reads local JSON:
  {
    "context": "I love medieval architecture",
    "voiceModelId": "802e3bc2..."
  }
  ↓
Mod calls Replik API:
  POST /api/speak
  {
    "userId": "802e3bc2...",
    "message": "should I build a castle?"
  }
  ↓
Replik processes:
  1. Loads personality: "I love medieval architecture"
  2. Calls Claude: "Yes! Castles are awesome. Go for Gothic style."
  3. Calls Fish Audio TTS with voiceModelId
  4. Returns: { text: "...", audioUrl: "/uploads/.../response.mp3" }
  ↓
Mod downloads audio from audioUrl
  ↓
Mod plays audio in-game
  ↓
Player hears their clone's voice: "Yes! Castles are awesome."
```

---

## Questions?

**Q: Can I train a local voice model instead?**  
A: Yes, but it's complex. You'd need:
- Coqui TTS (open-source)
- GPU for training (30+ minutes)
- 10-20 mins of audio samples
- Python environment in Minecraft mod (impractical)

**Not recommended for hackathons.**

---

**Q: What if Fish Audio shuts down?**  
A: Options:
1. Switch to another TTS provider (ElevenLabs, Play.ht)
2. Export your training audio and re-train elsewhere
3. Fall back to local TTS

---

**Q: Can I share my voice model with friends?**  
A: Yes! Just share your `voiceModelId`. But:
- ⚠️ They'll use YOUR Fish Audio quota
- ⚠️ They'll hear YOUR voice
- 💡 Better to have each person train their own clone

---

## Next Steps

1. ✅ Export your clone data from Replik
2. ✅ Read `MINECRAFT_INTEGRATION.md` for full mod setup
3. ✅ Test API calls with `curl` (see examples above)
4. ✅ Implement Minecraft mod integration
5. 🚀 Build something awesome!

---

**Built with:** Replik + Fish Audio API  
**For:** Minecraft Forge 1.20.x  
**License:** MIT


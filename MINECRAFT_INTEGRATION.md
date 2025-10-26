# Replik → Minecraft Mod Integration Guide

## Overview

This guide explains how to **download and integrate your friends' AI clones** into your Minecraft mod as NPCs.

### Use Case: Import Friends as NPCs

1. **Your friend creates their clone** on Replik (records voice, adds personality context)
2. **You browse clones** → find your friend's clone
3. **You download their clone data** → saves as `friend_clone.json`
4. **You import into Minecraft** → your friend becomes an NPC with their voice and personality

### Integration Options:

1. **Offline Mode** (Recommended for MVP): Download all data and run personality locally
2. **Hybrid Mode** (Best UX): Store personality locally + call API for voice

---

## Architecture Comparison

### Option 1: Offline Mode (Recommended)
```
Minecraft Mod
  ↓
  Reads local JSON file (personality, face, audio samples)
  ↓
  Generates responses locally (using personality rules)
  ↓
  Plays pre-recorded audio samples (basic)
```

**Pros:**
- ✅ No API calls needed
- ✅ Works offline
- ✅ Fast response time
- ✅ No API costs

**Cons:**
- ❌ No voice synthesis (just text or basic audio)
- ❌ Static personality (no learning)

---

### Option 2: Hybrid Mode (Best Experience)
```
Minecraft Mod
  ↓
  Reads local JSON file (personality context)
  ↓
  Sends user message + personality to Replik API
  ↓
  Receives: Response text + Voice audio URL
  ↓
  Plays synthesized voice in-game
```

**Pros:**
- ✅ Full voice synthesis (Fish Audio)
- ✅ Dynamic personality (Claude AI)
- ✅ Emotion detection
- ✅ Context-aware responses

**Cons:**
- ❌ Requires internet
- ❌ API costs (Claude + Fish Audio)

---

## Recommended Approach: **Hybrid Mode**

**Why?** You get the best of both worlds:
- Personality stored locally (fast, no repeated API calls)
- Voice generated on-demand (high quality, emotional)
- Can fall back to text-only if offline

---

## Step 1: Download Clone Data from Replik

### Option A: Download YOUR OWN Clone

1. Login to Replik
2. Go to **"Build Context"** tab
3. Click **"📥 Export JSON"**
4. Save as `my_clone.json`

### Option B: Download SOMEONE ELSE'S Clone (for NPCs)

1. Login to Replik
2. Go to **Dashboard** → **"Browse Clone Models"**
3. Search for your friend's username (e.g., `@techie_sam`)
4. Click **"📥 Download for Minecraft"**
5. Save as `friend_name_clone.json`

**Example:** If you download 3 friends, you'll have:
```
MinecraftMod/resources/clones/
├── sam_chen_clone.json
├── maya_rodriguez_clone.json
└── alex_johnson_clone.json
```

### Downloaded JSON Structure:

```json
{
  // User identity
  "userId": "abc-123-def-456",
  "username": "techie_sam",
  "name": "Sam Chen",
  "bio": "Software engineer who loves AI and gaming",
  "createdAt": "2025-01-26T10:30:00Z",
  
  // Personality context (for prompts)
  "context": {
    "entries": [
      {
        "category": "story",
        "content": "I built my first game at age 12...",
        "timestamp": "2025-01-26T10:30:00Z"
      },
      {
        "category": "habit",
        "content": "I always test edge cases before deploying...",
        "timestamp": "2025-01-26T10:31:00Z"
      }
    ]
  },
  
  // Voice model (for Fish Audio API)
  "voiceModelId": "abc123def456",
  "audioUrl": "https://example.supabase.co/storage/v1/object/public/audio-recordings/...",
  "voiceProvider": "fish-audio",
  
  // Face/appearance data (optional)
  "faceData": {
    "contours": [...],
    "meshData": [...]
  },
  
  // API integration instructions
  "minecraftIntegration": {
    "apiUrl": "https://your-replik-app.railway.app/api/speak",
    "usage": "See MINECRAFT_INTEGRATION.md for implementation guide",
    "note": "voiceModelId is used to call Fish Audio API for voice synthesis"
  }
}
```

**Key Fields:**
- `userId`: Use this when calling `/api/speak`
- `voiceModelId`: References the trained voice model on Fish Audio
- `context.entries`: Use these to build personality prompts
- `minecraftIntegration.apiUrl`: Your Replik API endpoint

---

## Step 2: Set Up Your Minecraft Mod

### Project Structure:

```
MinecraftMod/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/yourmod/replik/
│   │   │       ├── ReplikMod.java
│   │   │       ├── CloneManager.java
│   │   │       ├── ReplikAPI.java
│   │   │       └── AudioPlayer.java
│   │   └── resources/
│   │       └── clones/
│   │           └── clone_data.json  ← Place exported JSON here
└── build.gradle
```

---

## Step 3: Implement Clone Manager (Java)

### CloneManager.java

```java
package com.yourmod.replik;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

public class CloneManager {
    private Map<String, CloneData> clones = new HashMap<>();
    
    // Load a clone from JSON
    public void loadClone(String cloneName, String jsonPath) {
        try {
            Gson gson = new Gson();
            JsonObject data = gson.fromJson(new FileReader(jsonPath), JsonObject.class);
            
            CloneData clone = new CloneData();
            clone.userId = data.get("userId").getAsString();
            clone.username = data.get("username").getAsString();
            clone.name = data.has("name") ? data.get("name").getAsString() : clone.username;
            clone.voiceModelId = data.has("voiceModelId") ? data.get("voiceModelId").getAsString() : null;
            
            // Parse context entries to build personality prompt
            JsonObject context = data.getAsJsonObject("context");
            if (context != null && context.has("entries")) {
                JsonArray entries = context.getAsJsonArray("entries");
                StringBuilder stories = new StringBuilder();
                StringBuilder habits = new StringBuilder();
                StringBuilder reactions = new StringBuilder();
                
                for (int i = 0; i < entries.size(); i++) {
                    JsonObject entry = entries.get(i).getAsJsonObject();
                    String category = entry.get("category").getAsString();
                    String content = entry.get("content").getAsString();
                    
                    switch (category) {
                        case "story" -> stories.append(content).append(" ");
                        case "habit" -> habits.append(content).append(" ");
                        case "reaction" -> reactions.append(content).append(" ");
                    }
                }
                
                clone.personalityPrompt = String.format("""
                    You are an AI clone of %s (@%s). Respond EXACTLY how they would.
                    
                    BACKGROUND: %s
                    HABITS: %s
                    REACTIONS: %s
                    
                    Keep responses 1-2 sentences, conversational and authentic.
                    """,
                    clone.name,
                    clone.username,
                    stories.toString().trim(),
                    habits.toString().trim(),
                    reactions.toString().trim()
                );
            }
            
            clones.put(cloneName, clone);
            System.out.println("✅ Clone loaded: " + clone.name);
            
        } catch (Exception e) {
            System.err.println("❌ Failed to load clone data: " + e.getMessage());
        }
    }
    
    // Get a specific clone
    public CloneData getClone(String cloneName) {
        return clones.get(cloneName);
    }
    
    // Inner class to store clone data
    public static class CloneData {
        public String userId;
        public String username;
        public String name;
        public String voiceModelId;
        public String personalityPrompt;
    }
}
```

---

## Step 4: Implement API Client (Java)

### ReplikAPI.java

```java
package com.yourmod.replik;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.net.http.*;
import java.net.URI;

public class ReplikAPI {
    private static final String API_BASE_URL = "https://your-replik-deployment.railway.app";
    private final HttpClient client;
    
    public ReplikAPI() {
        this.client = HttpClient.newHttpClient();
    }
    
    public CloneResponse getCloneResponse(String userId, String message, String personalityPrompt) {
        try {
            // Build request body
            JsonObject body = new JsonObject();
            body.addProperty("userId", userId);
            body.addProperty("message", message);
            body.addProperty("personalityPrompt", personalityPrompt);
            
            // Send POST request
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/api/speak"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();
            
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            // Parse response
            JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
            String text = json.get("text").getAsString();
            String audioUrl = json.has("audioUrl") ? json.get("audioUrl").getAsString() : null;
            
            return new CloneResponse(text, audioUrl);
            
        } catch (Exception e) {
            System.err.println("❌ API call failed: " + e.getMessage());
            return new CloneResponse("Sorry, I couldn't respond right now.", null);
        }
    }
    
    public static class CloneResponse {
        public final String text;
        public final String audioUrl;
        
        public CloneResponse(String text, String audioUrl) {
            this.text = text;
            this.audioUrl = audioUrl;
        }
    }
}
```

---

## Step 5: Implement Audio Player (Java)

### AudioPlayer.java

```java
package com.yourmod.replik;

import javax.sound.sampled.*;
import java.io.BufferedInputStream;
import java.net.URL;

public class AudioPlayer {
    public void playAudioFromUrl(String audioUrl) {
        new Thread(() -> {
            try {
                // Download audio stream
                URL url = new URL(audioUrl);
                AudioInputStream audioStream = AudioSystem.getAudioInputStream(
                    new BufferedInputStream(url.openStream())
                );
                
                // Get audio format
                AudioFormat format = audioStream.getFormat();
                DataLine.Info info = new DataLine.Info(Clip.class, format);
                
                // Play audio
                Clip clip = (Clip) AudioSystem.getLine(info);
                clip.open(audioStream);
                clip.start();
                
                // Wait for completion
                while (!clip.isRunning()) Thread.sleep(10);
                while (clip.isRunning()) Thread.sleep(10);
                
                clip.close();
                audioStream.close();
                
            } catch (Exception e) {
                System.err.println("❌ Audio playback failed: " + e.getMessage());
            }
        }).start();
    }
}
```

---

## Step 6: Wire It All Together

### ReplikMod.java

```java
package com.yourmod.replik;

import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.event.ServerChatEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

@Mod("replik_mod")
public class ReplikMod {
    private CloneManager cloneManager;
    private ReplikAPI api;
    private AudioPlayer audioPlayer;
    
    public ReplikMod() {
        // Load multiple clones (your friends as NPCs!)
        cloneManager = new CloneManager();
        cloneManager.loadClone("sam", "./clones/sam_chen_clone.json");
        cloneManager.loadClone("maya", "./clones/maya_rodriguez_clone.json");
        cloneManager.loadClone("alex", "./clones/alex_johnson_clone.json");
        
        api = new ReplikAPI();
        audioPlayer = new AudioPlayer();
    }
    
    @SubscribeEvent
    public void onPlayerChat(ServerChatEvent event) {
        String message = event.getMessage();
        
        // Talk to different clones using @username
        // Example: "@sam how do I beat the Ender Dragon?"
        if (message.startsWith("@")) {
            String[] parts = message.substring(1).split(" ", 2);
            if (parts.length < 2) return;
            
            String cloneName = parts[0].toLowerCase();
            String input = parts[1];
            
            // Get the clone
            CloneManager.CloneData clone = cloneManager.getClone(cloneName);
            if (clone == null) {
                event.getPlayer().sendMessage(
                    Component.literal("§c[Error]§f Clone not found: " + cloneName)
                );
                return;
            }
            
            // Call API with clone's personality
            ReplikAPI.CloneResponse response = api.getCloneResponse(
                clone.userId,
                input,
                clone.personalityPrompt
            );
            
            // Display response in chat
            event.getPlayer().sendMessage(
                Component.literal("§b[@" + clone.username + "]§f " + response.text)
            );
            
            // Play voice audio
            if (response.audioUrl != null) {
                audioPlayer.playAudioFromUrl(response.audioUrl);
            }
            
            event.setCanceled(true);
        }
    }
}
```

---

## Step 7: Deploy Replik API (For Hybrid Mode)

### Railway Deployment:

1. Push your Replik codebase to GitHub
2. Go to [Railway](https://railway.app)
3. Click **"New Project"** → **"Deploy from GitHub"**
4. Select your Replik repo
5. Add environment variables:
   ```
   DATABASE_URL=your_supabase_pooled_url
   DIRECT_URL=your_supabase_direct_url
   ANTHROPIC_API_KEY=your_claude_key
   FISH_AUDIO_API_KEY=your_fish_key
   ```
6. Copy the deployment URL (e.g., `https://replik-production.up.railway.app`)
7. Update `API_BASE_URL` in `ReplikAPI.java`

---

## Step 8: Usage in Minecraft

### In-Game Commands:

```
Player: @sam how do I defeat the Ender Dragon?
Sam's Clone: [@techie_sam] Oh, I'd probably cheese it with beds tbh. 
             Quick, effective, and kinda funny. 🎧

Player: @maya what should I build next?
Maya's Clone: [@artist_maya] Ooh, how about a floating crystal palace? 
              Something with lots of stained glass and waterfalls! 🎨

Player: @alex best Minecraft mods?
Alex's Clone: [@gamer_alex] Dude, definitely try Create mod. 
              Mechanical contraptions are insanely satisfying. ⚙️
```

Each clone will:
1. ✅ Respond with THEIR personality (from their context entries)
2. ✅ Use THEIR voice (synthesized via Fish Audio)
3. ✅ Match THEIR emotional tone (via Claude AI)

**You're literally talking to your friends inside Minecraft!** 🤯

---

## API Endpoints Reference

### POST `/api/speak`

**Request:**
```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "message": "What should I build next?",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "text": "Hmm, maybe a treehouse? I always wanted one of those.",
  "audioUrl": "https://your-app.railway.app/uploads/abc123/response_123456.mp3",
  "success": true
}
```

---

## Offline Mode (Simplified)

If you want **offline-only** (no API calls):

1. Export JSON with personality
2. Use a rule-based system:
   ```java
   public String getOfflineResponse(String input) {
       if (input.contains("build")) {
           return personality.get("habits").getAsString();
       }
       // Add more rules...
       return "I'm not sure what to say.";
   }
   ```
3. Use pre-recorded audio samples from `audioUrl` field

---

## Testing Locally

### 1. Start Replik Dev Server:
```bash
cd Replik
npm run dev
```

### 2. Update API URL in Mod:
```java
private static final String API_BASE_URL = "http://localhost:3000";
```

### 3. Test API Call:
```bash
curl -X POST http://localhost:3000/api/speak \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000001",
    "message": "hi"
  }'
```

---

## Performance Considerations

### Caching Strategy:

```java
private Map<String, CloneResponse> responseCache = new HashMap<>();

public CloneResponse getCachedResponse(String message) {
    if (responseCache.containsKey(message)) {
        return responseCache.get(message);
    }
    
    CloneResponse response = api.getCloneResponse(userId, message, prompt);
    responseCache.put(message, response);
    return response;
}
```

### Rate Limiting:

```java
private long lastApiCall = 0;
private static final long MIN_DELAY_MS = 2000; // 2 seconds

public CloneResponse getRateLimitedResponse(String message) {
    long now = System.currentTimeMillis();
    if (now - lastApiCall < MIN_DELAY_MS) {
        return new CloneResponse("Give me a sec...", null);
    }
    lastApiCall = now;
    return api.getCloneResponse(userId, message, prompt);
}
```

---

## Security Best Practices

### 1. Environment Variables (Don't hardcode!)

```java
// ❌ BAD:
private static final String API_KEY = "sk-ant-1234567890";

// ✅ GOOD:
private static final String API_KEY = System.getenv("REPLIK_API_KEY");
```

### 2. HTTPS Only

```java
if (!API_BASE_URL.startsWith("https://")) {
    throw new IllegalArgumentException("API must use HTTPS!");
}
```

### 3. User ID Validation

```java
public boolean isValidUserId(String userId) {
    return userId.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
}
```

---

## Troubleshooting

### "Connection refused" Error

**Problem:** Can't reach Replik API

**Solution:**
```java
// Add timeout and retry logic
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build();
```

### "Audio playback failed" Error

**Problem:** Can't play Fish Audio MP3

**Solution:**
```bash
# Add MP3 codec support to your mod dependencies
implementation 'com.googlecode.soundlibs:mp3spi:1.9.5.4'
```

### "Invalid personality prompt" Error

**Problem:** Personality data is null

**Solution:**
```java
if (personality == null || personality.isJsonNull()) {
    personality = new JsonObject();
    personality.addProperty("stories", "Generic AI clone");
    personality.addProperty("habits", "Helpful and friendly");
    personality.addProperty("reactions", "Calm and logical");
}
```

---

## Example: Full Clone Interaction Flow

```
Player: @clone should I mine at night?
  ↓
Mod reads local JSON (personality context)
  ↓
Mod sends to Replik API:
  {
    "userId": "abc-123",
    "message": "should I mine at night?"
  }
  ↓
Replik API processes:
  1. Loads personality from database
  2. Calls Claude with personality context
  3. Generates response: "Nah, too risky. I'd rather play it safe."
  4. Calls Fish Audio TTS
  5. Returns: { text: "...", audioUrl: "https://..." }
  ↓
Mod displays text + plays audio
  ↓
Player hears their clone's voice saying:
  "Nah, too risky. I'd rather play it safe."
```

---

## Cost Estimation (Hybrid Mode)

### Per 1000 Interactions:

- **Claude API (Haiku)**: ~$0.25 (300 tokens avg)
- **Fish Audio TTS**: ~$0.15 (per minute of audio)
- **Total**: ~$0.40 per 1000 messages

### Free Tier:
- Claude: $5 free credits
- Fish Audio: 10,000 chars free/month

→ **~12,500 free messages/month** 🎉

---

## Next Steps

1. ✅ Export your clone data from Replik
2. ✅ Set up Minecraft Forge project
3. ✅ Implement `CloneManager`, `ReplikAPI`, `AudioPlayer`
4. ✅ Deploy Replik to Railway (for production)
5. ✅ Test in-game with `@clone` command
6. 🚀 Build something amazing!

---

## Support

- **Replik GitHub**: [your-repo-url]
- **Issues**: Report bugs via GitHub Issues
- **Discord**: [your-discord-server]

---

**Built with:** Replik (Next.js + Claude + Fish Audio)  
**For:** Minecraft Forge 1.20.x  
**License:** MIT


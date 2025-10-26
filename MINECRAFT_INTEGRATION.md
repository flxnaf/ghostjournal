# Replik → Minecraft Mod Integration Guide

## Overview

This guide explains how to **create custom NPCs in Minecraft** that talk and act like your friends using their Replik AI clones.

### What You're Building:

🎮 **Custom NPC Entities** with spawn eggs that:
- Spawn in creative mode (like villagers)
- Have basic AI (pathfinding, looking at player)
- Open a **chat GUI** when right-clicked (Minecraft-style)
- Respond with your **friend's personality** (via Claude AI)
- Speak with your **friend's voice** (via Fish Audio TTS)

### Use Case: Import Friends as NPCs

1. **Your friend creates their clone** on Replik (records voice, adds personality context)
2. **You browse clones** → find your friend's clone
3. **You download their clone data** → saves as `sam_clone.json`
4. **You place the JSON** in your mod's `clones/` folder
5. **In Minecraft:** Get spawn egg from creative menu → spawn your friend as an NPC
6. **Right-click NPC** → chat GUI opens → type message → NPC responds with friend's voice!

### Architecture:

```
Minecraft NPC Entity
  ↓ (right-click)
Custom Chat GUI
  ↓ (player types message)
Replik API (/api/speak)
  ↓ (sends: userId, message, personality)
Claude AI + Fish Audio
  ↓ (returns: response text + audio URL)
NPC speaks with friend's voice
```

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
│   │   │       ├── ReplikMod.java              ← Main mod class
│   │   │       ├── entity/
│   │   │       │   ├── CloneNPCEntity.java     ← Custom NPC entity
│   │   │       │   └── ModEntities.java        ← Entity registration
│   │   │       ├── item/
│   │   │       │   └── ModItems.java           ← Spawn egg registration
│   │   │       ├── client/
│   │   │       │   ├── gui/
│   │   │       │   │   └── CloneChatScreen.java ← Chat GUI
│   │   │       │   └── renderer/
│   │   │       │       └── CloneNPCRenderer.java ← NPC skin/model
│   │   │       ├── network/
│   │   │       │   └── ModPackets.java         ← Client-server sync
│   │   │       ├── api/
│   │   │       │   ├── CloneManager.java       ← Load clone data
│   │   │       │   ├── ReplikAPI.java          ← API client
│   │   │       │   └── AudioPlayer.java        ← Voice playback
│   │   │       └── util/
│   │   │           └── CloneRegistry.java      ← Map clones to spawn eggs
│   │   └── resources/
│   │       ├── clones/
│   │       │   ├── sam_clone.json              ← Friend's clone data
│   │       │   ├── maya_clone.json
│   │       │   └── alex_clone.json
│   │       ├── assets/
│   │       │   └── replik/
│   │       │       ├── textures/
│   │       │       │   ├── entity/
│   │       │       │   │   └── clone_npc.png   ← NPC skin
│   │       │       │   └── item/
│   │       │       │       └── clone_spawn_egg.png
│   │       │       └── models/
│   │       │           └── entity/
│   │       │               └── clone_npc.json  ← NPC model
│   │       └── META-INF/
│   │           └── mods.toml
└── build.gradle
```

---

## Step 3: Register Custom NPC Entity

### ModEntities.java - Register the NPC Entity Type

```java
package com.yourmod.replik.entity;

import com.yourmod.replik.ReplikMod;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModEntities {
    public static final DeferredRegister<EntityType<?>> ENTITIES = 
        DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, ReplikMod.MOD_ID);
    
    public static final RegistryObject<EntityType<CloneNPCEntity>> CLONE_NPC = 
        ENTITIES.register("clone_npc", () -> 
            EntityType.Builder.of(CloneNPCEntity::new, MobCategory.CREATURE)
                .sized(0.6F, 1.95F) // Same as player
                .clientTrackingRange(10)
                .build("clone_npc")
        );
}
```

---

## Step 4: Create the NPC Entity

### CloneNPCEntity.java - The Custom NPC

```java
package com.yourmod.replik.entity;

import com.yourmod.replik.api.CloneManager;
import net.minecraft.world.entity.PathfinderMob;
import net.minecraft.world.entity.ai.goal.*;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.level.Level;
import net.minecraft.nbt.CompoundTag;

public class CloneNPCEntity extends PathfinderMob {
    private String cloneId; // Which clone JSON to use
    
    public CloneNPCEntity(EntityType<? extends PathfinderMob> entityType, Level level) {
        super(entityType, level);
    }
    
    @Override
    protected void registerGoals() {
        // Basic AI behaviors (like villagers)
        this.goalSelector.addGoal(0, new FloatGoal(this));
        this.goalSelector.addGoal(1, new PanicGoal(this, 1.25D));
        this.goalSelector.addGoal(2, new LookAtPlayerGoal(this, Player.class, 8.0F));
        this.goalSelector.addGoal(3, new RandomLookAroundGoal(this));
        this.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(this, 1.0D));
    }
    
    @Override
    public InteractionResult mobInteract(Player player, InteractionHand hand) {
        // When right-clicked, open chat GUI
        if (!this.level().isClientSide && hand == InteractionHand.MAIN_HAND) {
            // Open chat GUI on client side
            openChatGUI(player);
            return InteractionResult.SUCCESS;
        }
        return InteractionResult.PASS;
    }
    
    private void openChatGUI(Player player) {
        // Send packet to client to open GUI
        // (Handled by ModPackets)
        ModPackets.sendOpenChatGUI(player, this.cloneId, this.getId());
    }
    
    public void setCloneId(String cloneId) {
        this.cloneId = cloneId;
    }
    
    public String getCloneId() {
        return this.cloneId;
    }
    
    @Override
    public void addAdditionalSaveData(CompoundTag tag) {
        super.addAdditionalSaveData(tag);
        if (this.cloneId != null) {
            tag.putString("CloneId", this.cloneId);
        }
    }
    
    @Override
    public void readAdditionalSaveData(CompoundTag tag) {
        super.readAdditionalSaveData(tag);
        if (tag.contains("CloneId")) {
            this.cloneId = tag.getString("CloneId");
        }
    }
    
    @Override
    public boolean removeWhenFarAway(double distance) {
        return false; // Don't despawn
    }
}
```

---

## Step 5: Create Spawn Eggs

### ModItems.java - Register Spawn Eggs

```java
package com.yourmod.replik.item;

import com.yourmod.replik.ReplikMod;
import com.yourmod.replik.entity.ModEntities;
import net.minecraft.world.item.Item;
import net.minecraftforge.common.ForgeSpawnEggItem;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS = 
        DeferredRegister.create(ForgeRegistries.ITEMS, ReplikMod.MOD_ID);
    
    // Spawn eggs for each clone
    public static final RegistryObject<ForgeSpawnEggItem> SAM_CLONE_SPAWN_EGG = 
        ITEMS.register("sam_clone_spawn_egg", () -> 
            new CloneSpawnEggItem(ModEntities.CLONE_NPC, "sam", 0x3B82F6, 0x1E40AF)
        );
    
    public static final RegistryObject<ForgeSpawnEggItem> MAYA_CLONE_SPAWN_EGG = 
        ITEMS.register("maya_clone_spawn_egg", () -> 
            new CloneSpawnEggItem(ModEntities.CLONE_NPC, "maya", 0xEC4899, 0x9333EA)
        );
    
    public static final RegistryObject<ForgeSpawnEggItem> ALEX_CLONE_SPAWN_EGG = 
        ITEMS.register("alex_clone_spawn_egg", () -> 
            new CloneSpawnEggItem(ModEntities.CLONE_NPC, "alex", 0x10B981, 0x059669)
        );
}

// Custom spawn egg that sets clone ID
class CloneSpawnEggItem extends ForgeSpawnEggItem {
    private final String cloneId;
    
    public CloneSpawnEggItem(RegistryObject<EntityType<CloneNPCEntity>> entity, 
                             String cloneId, int bgColor, int fgColor) {
        super(() -> entity.get(), bgColor, fgColor, new Item.Properties());
        this.cloneId = cloneId;
    }
    
    @Override
    public InteractionResult useOn(UseOnContext context) {
        InteractionResult result = super.useOn(context);
        
        // Set the clone ID after spawning
        Level level = context.getLevel();
        if (!level.isClientSide) {
            // Find the just-spawned entity and set its clone ID
            AABB searchBox = new AABB(context.getClickedPos()).inflate(2.0);
            List<CloneNPCEntity> entities = level.getEntitiesOfClass(
                CloneNPCEntity.class, searchBox
            );
            
            if (!entities.isEmpty()) {
                entities.get(0).setCloneId(this.cloneId);
            }
        }
        
        return result;
    }
}
```

---

## Step 6: Create Chat GUI

### CloneChatScreen.java - Minecraft-Style Chat Interface

```java
package com.yourmod.replik.client.gui;

import com.mojang.blaze3d.systems.RenderSystem;
import com.yourmod.replik.api.ReplikAPI;
import com.yourmod.replik.api.CloneManager;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.components.EditBox;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import java.util.ArrayList;
import java.util.List;

public class CloneChatScreen extends Screen {
    private final String cloneId;
    private final int entityId;
    private EditBox inputBox;
    private List<String> chatHistory = new ArrayList<>();
    private ReplikAPI api;
    private CloneManager cloneManager;
    
    public CloneChatScreen(String cloneId, int entityId) {
        super(Component.literal("Chat with Clone"));
        this.cloneId = cloneId;
        this.entityId = entityId;
        this.api = new ReplikAPI();
        this.cloneManager = new CloneManager();
    }
    
    @Override
    protected void init() {
        // Input box at bottom
        this.inputBox = new EditBox(
            this.font,
            this.width / 2 - 150,
            this.height - 40,
            300,
            20,
            Component.literal("Type message...")
        );
        this.inputBox.setMaxLength(256);
        this.addRenderableWidget(this.inputBox);
        
        // Send button
        this.addRenderableWidget(Button.builder(
            Component.literal("Send"),
            button -> sendMessage()
        )
        .bounds(this.width / 2 + 160, this.height - 40, 60, 20)
        .build());
        
        // Close button
        this.addRenderableWidget(Button.builder(
            Component.literal("Close"),
            button -> this.onClose()
        )
        .bounds(this.width / 2 + 225, this.height - 40, 60, 20)
        .build());
    }
    
    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        // Dark background (like Minecraft menus)
        this.renderBackground(graphics);
        
        // Title
        graphics.drawCenteredString(
            this.font,
            "Chat with " + this.cloneManager.getClone(cloneId).name,
            this.width / 2,
            20,
            0xFFFFFF
        );
        
        // Chat history
        int y = 50;
        for (int i = Math.max(0, chatHistory.size() - 10); i < chatHistory.size(); i++) {
            String message = chatHistory.get(i);
            graphics.drawString(this.font, message, 20, y, 0xFFFFFF);
            y += 12;
        }
        
        super.render(graphics, mouseX, mouseY, partialTick);
    }
    
    private void sendMessage() {
        String message = this.inputBox.getValue().trim();
        if (message.isEmpty()) return;
        
        // Add to chat history
        chatHistory.add("§b[You]§f " + message);
        this.inputBox.setValue("");
        
        // Get clone data
        CloneManager.CloneData clone = cloneManager.getClone(cloneId);
        
        // Call Replik API (async)
        new Thread(() -> {
            try {
                ReplikAPI.CloneResponse response = api.getCloneResponse(
                    clone.userId,
                    message,
                    clone.personalityPrompt
                );
                
                // Add response to chat history (on main thread)
                minecraft.execute(() -> {
                    chatHistory.add("§e[@" + clone.username + "]§f " + response.text);
                    
                    // Play voice audio
                    if (response.audioUrl != null) {
                        audioPlayer.playAudioFromUrl(response.audioUrl);
                    }
                });
                
            } catch (Exception e) {
                minecraft.execute(() -> {
                    chatHistory.add("§c[Error] Failed to get response");
                });
            }
        }).start();
    }
    
    @Override
    public boolean keyPressed(int keyCode, int scanCode, int modifiers) {
        // Send on Enter key
        if (keyCode == 257) { // Enter key
            sendMessage();
            return true;
        }
        return super.keyPressed(keyCode, scanCode, modifiers);
    }
    
    @Override
    public boolean isPauseScreen() {
        return false; // Don't pause game
    }
}
```

---

## Step 7: Implement Clone Manager (Java)

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

## Step 8: Implement API Client (Java)

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

## Step 9: Implement Audio Player (Java)

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

## Step 10: Wire It All Together

### ReplikMod.java - Main Mod Class

```java
package com.yourmod.replik;

import com.yourmod.replik.entity.ModEntities;
import com.yourmod.replik.item.ModItems;
import com.yourmod.replik.api.CloneManager;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

@Mod("replik")
public class ReplikMod {
    public static final String MOD_ID = "replik";
    private static CloneManager cloneManager;
    
    public ReplikMod() {
        IEventBus modEventBus = FMLJavaModLoadingContext.get().getModEventBus();
        
        // Register entities and items
        ModEntities.ENTITIES.register(modEventBus);
        ModItems.ITEMS.register(modEventBus);
        
        // Setup events
        modEventBus.addListener(this::commonSetup);
        modEventBus.addListener(this::clientSetup);
    }
    
    private void commonSetup(final FMLCommonSetupEvent event) {
        // Load clone data from JSON files
        cloneManager = new CloneManager();
        cloneManager.loadClone("sam", "clones/sam_clone.json");
        cloneManager.loadClone("maya", "clones/maya_clone.json");
        cloneManager.loadClone("alex", "clones/alex_clone.json");
        
        System.out.println("✅ Replik mod loaded with " + cloneManager.getCloneCount() + " clones");
    }
    
    private void clientSetup(final FMLClientSetupEvent event) {
        // Register entity renderers
        event.enqueueWork(() -> {
            EntityRenderers.register(ModEntities.CLONE_NPC.get(), CloneNPCRenderer::new);
        });
    }
    
    public static CloneManager getCloneManager() {
        return cloneManager;
    }
}
```

### ModPackets.java - Network Communication

```java
package com.yourmod.replik.network;

import com.yourmod.replik.client.gui.CloneChatScreen;
import net.minecraft.client.Minecraft;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.network.NetworkEvent;
import java.util.function.Supplier;

public class ModPackets {
    
    // Packet to open chat GUI on client
    public static class OpenChatGUIPacket {
        private final String cloneId;
        private final int entityId;
        
        public OpenChatGUIPacket(String cloneId, int entityId) {
            this.cloneId = cloneId;
            this.entityId = entityId;
        }
        
        public static void encode(OpenChatGUIPacket packet, FriendlyByteBuf buf) {
            buf.writeUtf(packet.cloneId);
            buf.writeInt(packet.entityId);
        }
        
        public static OpenChatGUIPacket decode(FriendlyByteBuf buf) {
            return new OpenChatGUIPacket(buf.readUtf(), buf.readInt());
        }
        
        public static void handle(OpenChatGUIPacket packet, Supplier<NetworkEvent.Context> ctx) {
            ctx.get().enqueueWork(() -> {
                // Open GUI on client side
                Minecraft.getInstance().setScreen(
                    new CloneChatScreen(packet.cloneId, packet.entityId)
                );
            });
            ctx.get().setPacketHandled(true);
        }
    }
    
    public static void sendOpenChatGUI(ServerPlayer player, String cloneId, int entityId) {
        // Send packet to client
        // (Network registration code omitted for brevity)
        PacketHandler.INSTANCE.send(
            PacketDistributor.PLAYER.with(() -> player),
            new OpenChatGUIPacket(cloneId, entityId)
        );
    }
}
```

---

## Step 11: Deploy Replik API (Backend)

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

## Step 12: Usage in Minecraft

### In-Game Flow:

1. **Open Creative Mode** → Search for spawn eggs:
   - "Sam's Clone Spawn Egg" (blue)
   - "Maya's Clone Spawn Egg" (pink)
   - "Alex's Clone Spawn Egg" (green)

2. **Right-click ground** → NPC spawns (looks like a player)

3. **Right-click NPC** → Chat GUI opens (Minecraft-style interface)

4. **Type your message** → Press Enter

5. **NPC responds:**
   - Text appears in chat history
   - Voice plays through speakers (Fish Audio TTS)
   - NPC looks at you while talking

### Example Conversations:

**With Sam's Clone:**
```
[You] how do I defeat the Ender Dragon?
[@techie_sam] Oh, I'd probably cheese it with beds tbh. 
              Quick, effective, and kinda funny. 🎧
```

**With Maya's Clone:**
```
[You] what should I build next?
[@artist_maya] Ooh, how about a floating crystal palace? 
               Something with lots of stained glass and waterfalls! 🎨
```

**With Alex's Clone:**
```
[You] best Minecraft mods?
[@gamer_alex] Dude, definitely try Create mod. 
              Mechanical contraptions are insanely satisfying. ⚙️
```

### What Makes It Special:

1. ✅ **Persistent NPCs** - They stay in your world, don't despawn
2. ✅ **Real personalities** - Responds exactly how your friend would
3. ✅ **Real voices** - Speaks with your friend's actual voice
4. ✅ **Basic AI** - Walks around, looks at you, avoids water
5. ✅ **Multiple clones** - Spawn as many friends as you want!

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


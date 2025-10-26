# Testing Guide - Digital Twins Minecraft Mod

## Overview

This mod has **TWO modes** you can test:
1. **MVP Mode** - Command-based (fully implemented)
2. **Advanced Mode** - GUI + Custom entities (fully implemented)

Both modes feature full voice playback!

---

## ✅ MVP Mode Testing

### Prerequisites
- Web app running: `npm run dev`
- Minecraft 1.20.1 with Fabric + required mods
- User created in database with digital twin data

### Test Steps

1. **Build and install mod:**
   ```bash
   cd minecraft-mod
   ./gradlew build
   cp build/libs/digitaltwins-1.0.0.jar ~/.minecraft/mods/
   ```

2. **Launch Minecraft 1.20.1**

3. **Import a twin:**
   ```
   /twinimport http://localhost:3000/api/minecraft/export/YOUR_USER_ID
   ```

   **Expected:** `✓ Loaded twin: YourName`

4. **List twins:**
   ```
   /twinlist
   ```

   **Expected:** Shows imported twins

5. **Spawn twin:**
   ```
   /twinspawn YourName
   ```

   **Expected:** Armor stand appears with name tag

6. **Chat with twin:**
   ```
   /twin YourName What's your favorite food?
   ```

   **Expected:**
   - Text response after 3-5 seconds
   - 🔊 Voice plays through speakers!

7. **Remove twin:**
   ```
   /twinremove YourName
   ```

   **Expected:** NPC despawns

---

## 🎯 Advanced Mode Testing

### Prerequisites
- Same as MVP Mode
- Twin already imported via `/twinimport`

### Test Steps

1. **Get spawn egg:**
   - Open creative inventory (E key)
   - Search for "Twin Spawn Egg"
   - Should appear with blue/cyan colors

2. **Spawn custom entity:**
   - Right-click ground with spawn egg
   - **Expected:** Custom entity spawns (looks like player)
   - **Expected:** AI behavior - walks around, looks at you

3. **Interact with entity:**
   - Right-click the entity
   - **Expected:** Custom GUI opens
   - **Expected:** Title shows twin name

4. **Chat via GUI:**
   - Type message in text box
   - Press Enter or click "Send"
   - **Expected:** Message appears in chat history
   - **Expected:** "Thinking..." message
   - **Expected:** Response appears after 3-5 seconds
   - **Expected:** 🔊 Voice plays!

5. **Multiple messages:**
   - Send several messages
   - **Expected:** Chat history scrolls
   - **Expected:** Voice plays for each response

6. **Close GUI:**
   - Click "Close" button or press Esc
   - **Expected:** Returns to game

---

## 🔊 Voice Playback Testing

### Test Audio System

1. **Check API response:**
   ```bash
   curl -X POST http://localhost:3000/api/speak \
     -H "Content-Type: application/json" \
     -d '{"userId":"YOUR_USER_ID","message":"test"}'
   ```

   **Expected:** Returns `audioUrl` field

2. **Verify MP3 file:**
   - Open returned audio URL in browser
   - **Expected:** MP3 file downloads/plays

3. **Test in-game:**
   - Use `/twin` command or GUI
   - Check console logs for audio playback
   - **Expected:** See "🔊 Playing voice audio..." in logs

---

## 🐛 Troubleshooting

### Build Issues

**Error: "Could not resolve dependencies"**
```bash
cd minecraft-mod
./gradlew clean build --refresh-dependencies
```

**Error: "Java version mismatch"**
- Ensure JDK 17+ is installed
- Check: `java -version`

### Runtime Issues

**Mod doesn't load:**
- Check `.minecraft/logs/latest.log`
- Ensure Fabric Loader 0.15.0+ installed
- Install Fabric API and Fabric Language Kotlin

**Spawn egg not in creative menu:**
- Restart Minecraft
- Check "Tools" creative tab
- Look for "Twin Spawn Egg"

**GUI doesn't open:**
- Check server logs for errors
- Ensure client and server both loaded mod
- Try `/twinimport` first to ensure twin data exists

**Voice doesn't play:**
- Check console for "Audio playback failed"
- Verify `/api/speak` returns valid `audioUrl`
- Test audio URL directly in browser
- Check audio output device

**Entity has no AI:**
- Entity should walk around randomly
- Should look at nearby players
- If standing still, check logs for errors

---

## 📊 Expected Behavior

### MVP Mode (Commands)
| Command | Expected Result | Time |
|---------|----------------|------|
| `/twinimport` | Downloads twin data | 1-2s |
| `/twinlist` | Shows twins instantly | <1s |
| `/twinspawn` | Armor stand appears | <1s |
| `/twin` | Text + voice response | 3-5s |
| `/twinremove` | NPC despawns | <1s |

### Advanced Mode (GUI)
| Action | Expected Result | Time |
|--------|----------------|------|
| Use spawn egg | Custom entity spawns | <1s |
| Right-click entity | GUI opens | <1s |
| Send message | Response + voice | 3-5s |
| Walk near entity | Entity looks at you | Instant |
| Wait | Entity wanders | Continuous |

---

## 🎬 Demo Script

**For showing judges:**

1. **Setup** (30s)
   - "I created my digital twin on the web app"
   - Show `/minecraft` page
   - Copy export URL

2. **MVP Demo** (1min)
   - `/twinimport https://...`
   - `/twinspawn Alex`
   - `/twin Alex What's your favorite food?`
   - **VOICE PLAYS** 🔊

3. **Advanced Demo** (1min)
   - Open creative inventory
   - Get spawn egg
   - Spawn custom entity
   - Right-click → GUI opens
   - Chat with voice!

4. **Explain** (30s)
   - "Same personality and voice"
   - "Real-time Claude AI"
   - "Fish Audio voice cloning"
   - "Two interaction modes"

**Total: 3 minutes for complete demo**

---

## 🧪 Test Checklist

### MVP Mode
- [ ] Mod loads without errors
- [ ] `/twinimport` downloads twin data
- [ ] `/twinlist` shows imported twins
- [ ] `/twinspawn` creates armor stand NPC
- [ ] `/twin` sends message and gets response
- [ ] Voice plays after response
- [ ] `/twinremove` despawns NPC
- [ ] Can spawn multiple different twins

### Advanced Mode
- [ ] Spawn egg appears in creative menu
- [ ] Spawn egg creates custom entity
- [ ] Entity has player model
- [ ] Entity walks around (AI)
- [ ] Entity looks at player
- [ ] Right-click opens GUI
- [ ] GUI shows twin name
- [ ] Can type in text box
- [ ] Send button works
- [ ] Enter key sends message
- [ ] Response appears in chat history
- [ ] Voice plays after response
- [ ] Close button works
- [ ] Can interact multiple times

### Voice System
- [ ] API returns audioUrl
- [ ] MP3 file is accessible
- [ ] Console shows "Playing voice audio..."
- [ ] Audio plays through speakers
- [ ] Works in both MVP and Advanced modes

---

## 📝 Known Issues

None currently! Both modes fully functional.

---

## 💡 Next Steps

If everything works:
1. ✅ Commit changes
2. ✅ Push to GitHub
3. ✅ Test end-to-end one more time
4. ✅ Prepare demo for judges
5. 🚀 Win Cal Hacks!

---

**Happy testing!** 🎮

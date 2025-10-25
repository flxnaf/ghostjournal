# EchoSelf - Final Testing Guide

## ✅ What We've Built

### 1. 🎤 **Voice Recording** (Step 1)
- 20-second audio capture
- Live waveform visualization
- Random speaking prompts
- Auto-stops after countdown

### 2. 📷 **Photo Capture** (Step 2)  
- Single sliding camera interface
- 5 photos: Front, Left, Right, Up, Down
- Auto-advances after each capture
- Live video preview (500px tall)
- Circular shutter button

### 3. 🗣️ **AI Clone Chat** (Step 3) - NEW!
- **3D Audio-Reactive Avatar** using Three.js
- Scenario-based conversations
- Debug logging for troubleshooting

---

## 🎨 New 3D Avatar Features

### What You'll See:
1. **3D Distorting Sphere** 
   - Blue metallic surface
   - Morphs based on audio levels
   - Glowing effect

2. **Particle Field**
   - 1000 floating particles
   - React to audio frequencies
   - Cyan color (#00fff5)

3. **Auto-Rotation**
   - Gentle idle animation
   - Speeds up when speaking
   - Orbits around center

### Audio-Reactive Behavior:
- **Idle**: Gentle breathing motion
- **Speaking**: Intense distortion + glow
- **Particles**: Pulse with audio beats

---

## 🧪 Testing Steps

### Test Chat API Response:

1. **Refresh** http://localhost:3000
2. **Complete audio + photos**
3. **Open Console** (F12 → Console)
4. **Send a test message**: `"Someone cuts you off in traffic. How would you respond?"`

### Expected Console Output:

```
💬 Sending message: Someone cuts you off in traffic...
✅ Received response: {text: "...", audioUrl: "..."}
🔊 Playing audio: /uploads/xxx/response_xxx.mp3
▶️ Video playing
```

### If You See Errors:

**Error 1: No response**
```
❌ Error sending message: Network Error
```
→ Backend not responding - check API keys in `.env`

**Error 2: No audio URL**
```
⚠️ No audio URL in response
```
→ Fish Audio API not configured or failed - check console in terminal

**Error 3: Claude error**
```
Error details: { error: 'Claude API failed' }
```
→ Anthropic API key invalid or out of credits

---

## 🎯 Chat Experience Design

### New Prompt Style:
Instead of: *"What's up?"*  
Use: *"Give me a scenario and I'll respond as you would"*

### Example Scenarios:
1. "Someone cuts you off in traffic. How would you respond?"
2. "Your friend cancels plans last minute. What do you say?"
3. "You're offered a promotion that requires relocation. How do you decide?"
4. "Someone criticizes your work. How do you handle it?"
5. "You find a wallet with $500. What do you do?"

### Clone Response Style:
The AI should mimic YOUR:
- Tone and manner
- Decision-making process
- Values and priorities
- Typical phrases/expressions

---

## 🔍 Debug Commands

### Check if API Routes Work:

**Test 1: Check user exists**
```bash
# In browser console
fetch('/api/speak', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',
    message: 'test',
    conversationHistory: []
  })
}).then(r => r.json()).then(console.log)
```

**Test 2: Check 3D rendering**
```javascript
// In browser console
document.querySelector('canvas') // Should return <canvas> element
```

**Test 3: Check audio data**
```javascript
// While clone is speaking
console.log('Is playing:', isPlaying)
console.log('Audio data length:', audioData.length)
```

---

## 🎬 3D Avatar Troubleshooting

### If Avatar Doesn't Load:

**Error: "Loading 3D Avatar..." forever**
- Three.js failed to load
- Check browser console for WebGL errors
- Try Chrome (best WebGL support)

**Error: Black screen instead of 3D**
- WebGL not supported
- Update graphics drivers
- Enable hardware acceleration in browser

**Error: Avatar not reacting to audio**
- Audio data not being captured
- Check `audioData` array in console
- Verify audio is playing

---

## 📊 Performance Expectations

### 3D Rendering:
- **FPS**: 60fps (smooth)
- **Particles**: 1000 (configurable)
- **CPU Usage**: ~20-30%
- **Load Time**: 1-2 seconds

### API Response Times:
- **Claude Text**: 2-4 seconds
- **Fish Audio TTS**: 2-5 seconds
- **Total**: 5-10 seconds

### Optimization Tips:
1. Reduce particles if laggy (change 1000 to 500)
2. Disable auto-rotate if slow
3. Lower audio analysis frequency

---

## 🚀 Next Steps After Testing

### If Chat Works:
1. ✅ Test different scenarios
2. ✅ Try longer conversations
3. ✅ Add more context memories
4. ✅ Record demo video

### If Chat Doesn't Work:
1. Check `.env` file has both API keys
2. Look at terminal for API errors
3. Check browser console for frontend errors
4. Try simpler message first: "Hello"

### If 3D Works:
1. ✅ Enjoy the visual!
2. ✅ Watch it react to voice
3. ✅ Try orbiting with mouse
4. ✅ Test on different browsers

### If 3D Doesn't Work:
1. Revert to 2D: Remove Avatar3D import
2. Use WaveformCanvas instead
3. Check WebGL support: https://get.webgl.org/

---

## 💡 Known Issues & Workarounds

### Issue 1: First message takes long
**Why**: Cold start for APIs  
**Solution**: Wait 10-15 seconds for first response

### Issue 2: No voice audio
**Why**: Fish Audio API key not set or invalid  
**Solution**: Text responses still work! Voice is optional

### Issue 3: Generic responses
**Why**: Not enough context provided  
**Solution**: Fill out the context form more completely

### Issue 4: 3D is choppy
**Why**: Hardware limitations  
**Solution**: Reduce particle count or use 2D fallback

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ 3D sphere appears and rotates
2. ✅ You send a message
3. ✅ Clone responds with text
4. ✅ 3D avatar distorts/glows
5. ✅ Audio plays (if API configured)
6. ✅ Particles pulse with sound

---

## 📞 Debug Checklist

Before asking for help, verify:

- [ ] Both API keys in `.env`
- [ ] Browser console shows no errors
- [ ] Terminal shows no API errors
- [ ] 3D canvas element exists
- [ ] Message sent (check console log)
- [ ] Response received (check console log)
- [ ] WebGL is enabled

---

**Good luck testing! The 3D avatar should be much more impressive than the simple circle! 🎨✨**


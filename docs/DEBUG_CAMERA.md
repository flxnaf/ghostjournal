# Camera Debug Guide

## Changes Just Made:

1. ✅ **Added console logging** - See exactly what's happening
2. ✅ **Fixed video timing** - Set srcObject after React renders
3. ✅ **Explicit play() call** - Force video to start
4. ✅ **Changed button to camera icon** - Circular shutter button (like iPhone)
5. ✅ **Added video event handlers** - Log when video loads/plays
6. ✅ **Explicit display: block** - Ensure video is visible

## How to Debug:

### Step 1: Open Browser Console
- **Chrome**: Right-click → Inspect → Console tab
- **Safari**: Develop menu → Show JavaScript Console (enable Develop menu in Preferences first)

### Step 2: Click "Start Taking Photos"

### Step 3: Look for Console Logs:

**What you SHOULD see:**
```
🎥 Starting camera...
✅ Camera stream obtained: MediaStream {...}
🎬 Setting video source...
📹 Video metadata loaded
▶️ Video playing
```

**If you see an error:**
```
❌ Camera error: NotAllowedError
```
→ Camera permissions denied. Allow camera access!

```
❌ Camera error: NotFoundError
```
→ No camera found. Try different device.

### Step 4: Check Video Element

In console, type:
```javascript
document.querySelector('video')
```

Should show: `<video autoplay playsinline muted ...>`

Check if it has srcObject:
```javascript
document.querySelector('video').srcObject
```

Should show: `MediaStream {...}` (not null!)

## New Button Design:

📷 **Camera Shutter Icon** (instead of text)
- Big blue circle (80x80px)
- White circle inside (like camera shutter)
- Hover effect (scales up)
- Located on the right side below video

## If Video Still Doesn't Show:

1. **Check if captureMode is true**: State should change when button clicked
2. **Check if video element exists**: Should see black box with blue border
3. **Check stream**: Console logs will show if stream was obtained
4. **Try incognito/private mode**: Rules out extension conflicts
5. **Check camera is not in use**: Close other apps using camera

## Quick Test Script:

Paste in console after clicking "Start Taking Photos":
```javascript
const video = document.querySelector('video');
console.log('Video element:', video);
console.log('Has srcObject:', !!video?.srcObject);
console.log('Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);
console.log('Is playing:', !video?.paused);
```


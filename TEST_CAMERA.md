# Camera Testing Guide

## What Changed

Complete redesign with **single camera interface** that slides through photos!

### New Flow:

1. **Start Screen**: Shows "Start Taking Photos" button with 5 empty photo slots
2. **Camera Opens**: Full-screen camera with video preview (500px tall!)
3. **Progress Bar**: Visual indicator showing which photo you're on
4. **Slide Through**: After each capture, automatically moves to next photo
5. **Auto-Complete**: After 5th photo, camera closes automatically

### Features:

✅ **Large 500px video element** - impossible to miss!
✅ **Progress dots** - green (done), blue (current), gray (pending)  
✅ **Direction badges** - "👤 Look straight ahead", "👈 Turn LEFT", etc.
✅ **Auto-advance** - captures → next photo automatically
✅ **Face guide overlay** - pulsing cyan circle to help positioning

### To Test:

1. Refresh http://localhost:3000
2. Complete the 20-second audio recording
3. Click the BIG BLUE "📷 Start Taking Photos" button
4. **Camera should immediately open with HUGE video preview**
5. Click "CAPTURE" button
6. Should automatically slide to next photo
7. Repeat 5 times total

### Debug Checklist:

If video still doesn't show:
- Check browser console for errors
- Ensure camera permissions granted
- Try different browser (Chrome works best)
- Check that `videoRef.current.srcObject = stream` is executing

### Expected Behavior:

**Video element properties:**
- `autoPlay` - starts immediately
- `playsInline` - works on mobile
- `muted` - required for autoplay
- Height: 500px (very visible!)
- Border: 4px neon blue
- Shadow: glowing blue effect


package com.digitaltwins.advanced.client

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedInputStream
import java.io.ByteArrayInputStream
import javax.sound.sampled.AudioInputStream
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.Clip
import javax.sound.sampled.LineEvent

/**
 * Audio player for Twin voice responses
 * Downloads and plays MP3 files from URLs
 */
object TwinAudioPlayer {
    private val client = OkHttpClient()
    private var currentClip: Clip? = null
    
    /**
     * Play audio from a URL
     * Downloads the file and plays it using Java Sound API
     */
    fun playAudioFromUrl(url: String) {
        println("🔊 TwinAudioPlayer.playAudioFromUrl()")
        println("   URL: $url")
        
        // Stop any currently playing audio
        stopCurrentAudio()
        
        // Play on background thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("📥 Downloading audio from URL...")
                
                // Download audio file
                val request = Request.Builder()
                    .url(url)
                    .build()
                
                val response = client.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    println("❌ Failed to download audio: HTTP ${response.code}")
                    println("   Response: ${response.message}")
                    return@launch
                }
                
                val audioBytes = response.body?.bytes()
                if (audioBytes == null || audioBytes.isEmpty()) {
                    println("❌ No audio data received")
                    return@launch
                }
                
                println("✅ Downloaded ${audioBytes.size} bytes")
                println("🎵 Attempting to play audio...")
                
                // Try to play using Java Sound API
                try {
                    val inputStream = BufferedInputStream(ByteArrayInputStream(audioBytes))
                    val audioInputStream = AudioSystem.getAudioInputStream(inputStream)
                    
                    val clip = AudioSystem.getClip()
                    currentClip = clip
                    
                    // Add listener to clean up when done
                    clip.addLineListener { event ->
                        if (event.type == LineEvent.Type.STOP) {
                            clip.close()
                            if (currentClip == clip) {
                                currentClip = null
                            }
                        }
                    }
                    
                    clip.open(audioInputStream)
                    clip.start()
                    
                    println("✅ Audio playback started!")
                    println("   Format: ${audioInputStream.format}")
                    println("   Duration: ${clip.microsecondLength / 1_000_000.0} seconds")
                    
                } catch (e: Exception) {
                    println("❌ Failed to play audio with Java Sound API: ${e.message}")
                    println("   This might be an MP3 format issue - Java Sound needs plugins for MP3")
                    e.printStackTrace()
                    
                    // Try alternate approach: save to temp file and use system player
                    trySystemPlayer(audioBytes)
                }
                
            } catch (e: Exception) {
                println("❌ Failed to download/play audio: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Try to play audio using system's default player
     */
    private fun trySystemPlayer(audioBytes: ByteArray) {
        try {
            println("🔄 Trying system audio player...")
            
            // Create temp file
            val tempFile = kotlin.io.path.createTempFile("twin_audio", ".mp3").toFile()
            tempFile.writeBytes(audioBytes)
            tempFile.deleteOnExit()
            
            println("   Saved to: ${tempFile.absolutePath}")
            
            // Try to play using system command
            val os = System.getProperty("os.name").lowercase()
            val command = when {
                os.contains("mac") -> arrayOf("afplay", tempFile.absolutePath)
                os.contains("win") -> arrayOf("cmd", "/c", "start", tempFile.absolutePath)
                os.contains("nix") || os.contains("nux") -> arrayOf("mpg123", tempFile.absolutePath)
                else -> {
                    println("⚠️ Unknown OS, can't auto-play")
                    return
                }
            }
            
            val process = ProcessBuilder(*command).start()
            println("✅ Started system audio player")
            
        } catch (e: Exception) {
            println("❌ System player failed: ${e.message}")
            e.printStackTrace()
        }
    }
    
    /**
     * Stop currently playing audio
     */
    fun stopCurrentAudio() {
        currentClip?.let { clip ->
            if (clip.isRunning) {
                clip.stop()
            }
            clip.close()
            currentClip = null
            println("⏹️ Stopped current audio")
        }
    }
}


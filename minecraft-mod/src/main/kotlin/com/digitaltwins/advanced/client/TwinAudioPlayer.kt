package com.digitaltwins.advanced.client

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import net.minecraft.client.MinecraftClient
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.nio.file.Files

/**
 * Audio player for Twin voice responses
 * Downloads MP3 and plays using system audio player (afplay on Mac)
 */
object TwinAudioPlayer {
    private val client = OkHttpClient()
    private var currentProcess: Process? = null
    private val tempDir = Files.createTempDirectory("twin_audio").toFile().apply { 
        deleteOnExit() 
    }
    
    /**
     * Play audio from a URL
     * Downloads the file and plays it using system audio player
     */
    fun playAudioFromUrl(url: String) {
        println("═══════════════════════════════════════════")
        println("🔊 TWIN AUDIO PLAYER")
        println("═══════════════════════════════════════════")
        println("   URL: $url")
        println("   Temp dir: ${tempDir.absolutePath}")
        
        // Stop any currently playing audio
        stopCurrentAudio()
        
        // Download and play on background thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("📥 Downloading audio...")
                
                // Download audio file
                val request = Request.Builder()
                    .url(url)
                    .build()
                
                val response = client.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    println("❌ HTTP Error: ${response.code} - ${response.message}")
                    return@launch
                }
                
                val audioBytes = response.body?.bytes()
                if (audioBytes == null || audioBytes.isEmpty()) {
                    println("❌ No audio data received")
                    return@launch
                }
                
                println("✅ Downloaded ${audioBytes.size} bytes (${audioBytes.size / 1024} KB)")
                
                // Save to temp file
                val tempFile = File(tempDir, "response_${System.currentTimeMillis()}.mp3")
                tempFile.writeBytes(audioBytes)
                println("💾 Saved to: ${tempFile.absolutePath}")
                
                // Play using system audio player
                playSystemAudio(tempFile)
                
            } catch (e: Exception) {
                println("❌ Download/playback error: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    /**
     * Play audio file using system player
     */
    private fun playSystemAudio(audioFile: File) {
        try {
            val os = System.getProperty("os.name").lowercase()
            println("🖥️ Operating System: $os")
            
            val command = when {
                os.contains("mac") -> {
                    println("🍎 Using macOS 'afplay'")
                    arrayOf("afplay", audioFile.absolutePath)
                }
                os.contains("win") -> {
                    println("🪟 Using Windows Media Player")
                    arrayOf("cmd", "/c", "start", "/min", audioFile.absolutePath)
                }
                os.contains("nix") || os.contains("nux") -> {
                    println("🐧 Using Linux 'mpg123'")
                    arrayOf("mpg123", "-q", audioFile.absolutePath)
                }
                else -> {
                    println("❌ Unknown OS - cannot play audio")
                    return
                }
            }
            
            println("🎵 Executing: ${command.joinToString(" ")}")
            currentProcess = ProcessBuilder(*command)
                .redirectError(ProcessBuilder.Redirect.INHERIT)
                .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                .start()
            
            println("✅ Audio playback started!")
            
            // Clean up after playback finishes
            Thread {
                try {
                    currentProcess?.waitFor()
                    audioFile.delete()
                    println("🗑️ Cleaned up temp audio file")
                } catch (e: Exception) {
                    println("⚠️ Cleanup error: ${e.message}")
                }
            }.start()
            
        } catch (e: Exception) {
            println("❌ System player error: ${e.message}")
            e.printStackTrace()
        }
    }
    
    /**
     * Stop currently playing audio
     */
    fun stopCurrentAudio() {
        currentProcess?.let { process ->
            if (process.isAlive) {
                process.destroy()
                println("⏹️ Stopped current audio")
            }
            currentProcess = null
        }
    }
}


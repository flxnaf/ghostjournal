package com.digitaltwins.advanced.client

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import net.minecraft.client.MinecraftClient
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.nio.file.Files
import java.util.concurrent.TimeUnit

/**
 * Audio player for Twin voice responses
 * Uses Fish Audio TTS API to generate speech from text in real-time
 */
object TwinAudioPlayer {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    private var currentProcess: Process? = null
    private val tempDir = Files.createTempDirectory("twin_audio").toFile().apply { 
        deleteOnExit() 
    }
    
    // Fish Audio API configuration
    private val FISH_API_KEY = System.getenv("FISH_AUDIO_API_KEY") 
        ?: "dd66b6dad1214de68bd1fa9cd28f3c55"  // Fallback to your key
    
    /**
     * Generate speech from text using Fish Audio TTS API and play it
     * @param text The text to speak
     * @param voiceModelId The Fish Audio voice model ID (your trained voice)
     */
    fun playTextWithVoice(text: String, voiceModelId: String?) {
        println("═══════════════════════════════════════════")
        println("🔊 TWIN AUDIO PLAYER (Fish Audio TTS)")
        println("═══════════════════════════════════════════")
        println("   Text: ${text.substring(0, minOf(100, text.length))}...")
        println("   Voice Model ID: ${voiceModelId ?: "DEFAULT"}")
        println("   Fish API Key: ${FISH_API_KEY.substring(0, 10)}...")
        
        // Stop any currently playing audio
        stopCurrentAudio()
        
        // Generate and play on background thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Clean text for TTS (remove action descriptions)
                val cleanText = text
                    .replace(Regex("\\*[^*]+\\*"), "") // Remove *actions*
                    .replace(Regex("\\([^)]+\\)"), "") // Remove (thoughts)
                    .trim()
                
                println("🧹 Cleaned text: ${cleanText.substring(0, minOf(100, cleanText.length))}...")
                
                // Determine which voice to use
                val referenceId = if (!voiceModelId.isNullOrEmpty() && !voiceModelId.startsWith("mock_")) {
                    println("✅ Using trained voice model: ${voiceModelId.substring(0, 20)}...")
                    voiceModelId
                } else {
                    println("⚠️ Using default neutral English voice")
                    "af1ddb5dc0e644ebb16b58ed466e27c6"
                }
                
                // Build Fish Audio TTS request using FormData
                println("📤 Calling Fish Audio TTS API...")
                val boundary = "----WebKitFormBoundary${System.currentTimeMillis()}"
                val formData = buildString {
                    append("--$boundary\r\n")
                    append("Content-Disposition: form-data; name=\"text\"\r\n\r\n")
                    append("$cleanText\r\n")
                    append("--$boundary\r\n")
                    append("Content-Disposition: form-data; name=\"reference_id\"\r\n\r\n")
                    append("$referenceId\r\n")
                    append("--$boundary\r\n")
                    append("Content-Disposition: form-data; name=\"format\"\r\n\r\n")
                    append("mp3\r\n")
                    append("--$boundary--\r\n")
                }
                
                val request = Request.Builder()
                    .url("https://api.fish.audio/v1/tts")
                    .header("Authorization", "Bearer $FISH_API_KEY")
                    .header("Content-Type", "multipart/form-data; boundary=$boundary")
                    .post(formData.toRequestBody("multipart/form-data; boundary=$boundary".toMediaType()))
                    .build()
                
                val response = client.newCall(request).execute()
                
                if (!response.isSuccessful) {
                    println("❌ Fish Audio API Error: ${response.code} - ${response.message}")
                    println("   Response body: ${response.body?.string()}")
                    return@launch
                }
                
                val audioBytes = response.body?.bytes()
                if (audioBytes == null || audioBytes.isEmpty()) {
                    println("❌ No audio data received from Fish Audio")
                    return@launch
                }
                
                println("✅ Generated ${audioBytes.size} bytes (${audioBytes.size / 1024} KB) of audio")
                
                // Save to temp file
                val tempFile = File(tempDir, "tts_${System.currentTimeMillis()}.mp3")
                tempFile.writeBytes(audioBytes)
                println("💾 Saved to: ${tempFile.absolutePath}")
                
                // Play using system audio player
                playSystemAudio(tempFile)
                
            } catch (e: Exception) {
                println("❌ TTS generation/playback error: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    /**
     * DEPRECATED: Old method that downloaded from URL
     * Use playTextWithVoice() instead
     */
    @Deprecated("Use playTextWithVoice() for direct Fish Audio TTS")
    fun playAudioFromUrl(url: String) {
        println("⚠️ playAudioFromUrl is deprecated - this shouldn't be called")
        println("   URL: $url")
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


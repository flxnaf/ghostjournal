package com.digitaltwins

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.BufferedInputStream
import java.net.URL
import javax.sound.sampled.*

/**
 * Handles audio playback for twin voice responses
 */
object TwinAudioPlayer {
    private var currentClip: Clip? = null

    /**
     * Play audio from a URL (MP3 from Fish Audio API)
     */
    fun playAudioFromUrl(audioUrl: String) {
        // Stop any currently playing audio
        stopCurrentAudio()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("🔊 Downloading audio from: $audioUrl")

                val url = URL(audioUrl)
                val audioStream = AudioSystem.getAudioInputStream(
                    BufferedInputStream(url.openStream())
                )

                val format = audioStream.format
                val info = DataLine.Info(Clip::class.java, format)

                currentClip = AudioSystem.getLine(info) as Clip
                currentClip?.open(audioStream)
                currentClip?.start()

                println("🔊 Playing voice audio...")

                // Wait for playback to finish
                while (currentClip?.isRunning == true) {
                    Thread.sleep(100)
                }

                currentClip?.close()
                audioStream.close()

                println("✅ Audio playback complete")

            } catch (e: Exception) {
                println("❌ Audio playback failed: ${e.message}")
                e.printStackTrace()
            }
        }
    }

    /**
     * Stop currently playing audio
     */
    fun stopCurrentAudio() {
        currentClip?.let {
            if (it.isRunning) {
                it.stop()
            }
            it.close()
        }
        currentClip = null
    }
}

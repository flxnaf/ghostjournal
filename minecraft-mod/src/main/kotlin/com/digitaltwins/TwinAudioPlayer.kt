package com.digitaltwins

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.BufferedInputStream
import java.net.URL
import java.util.ArrayDeque
import javax.sound.sampled.AudioFormat
import javax.sound.sampled.AudioInputStream
import javax.sound.sampled.AudioSystem
import javax.sound.sampled.Clip
import javax.sound.sampled.DataLine

/**
 * Handles audio playback for twin voice responses
 */
object TwinAudioPlayer {
    private var currentClip: Clip? = null
    private val queue = ArrayDeque<String>()
    private var isPlaying = false

    /**
     * Play audio from a URL (MP3 from Fish Audio API)
     */
    fun enqueue(audioUrl: String) {
        synchronized(queue) {
            queue.addLast(audioUrl)
            if (!isPlaying) {
                isPlaying = true
                playNext()
            }
        }
    }

    private fun playNext() {
        val nextUrl: String? = synchronized(queue) {
            if (queue.isEmpty()) null else queue.removeFirst()
        }

        if (nextUrl == null) {
            synchronized(queue) { isPlaying = false }
            return
        }

        stopCurrentAudio()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("🔊 Downloading audio from: $nextUrl")
                val url = URL(nextUrl)

                BufferedInputStream(url.openStream()).use { bufferedStream ->
                    val rawStream = AudioSystem.getAudioInputStream(bufferedStream)
                    val sourceFormat = rawStream.format

                    println("🎛️ Source audio format: ${sourceFormat.encoding}, ${sourceFormat.sampleRate} Hz, ${sourceFormat.channels} ch")

                    val targetFormat: AudioFormat
                    val playbackStream: AudioInputStream

                    if (sourceFormat.encoding != AudioFormat.Encoding.PCM_SIGNED) {
                        targetFormat = AudioFormat(
                            AudioFormat.Encoding.PCM_SIGNED,
                            sourceFormat.sampleRate,
                            16,
                            sourceFormat.channels,
                            sourceFormat.channels * 2,
                            sourceFormat.sampleRate,
                            false
                        )

                        playbackStream = AudioSystem.getAudioInputStream(targetFormat, rawStream)
                        println("🎯 Converted audio to PCM_SIGNED (${targetFormat.sampleRate} Hz)")
                    } else {
                        targetFormat = sourceFormat
                        playbackStream = rawStream
                    }

                    try {
                        playbackStream.use { stream ->
                            val info = DataLine.Info(Clip::class.java, targetFormat)

                            if (!AudioSystem.isLineSupported(info)) {
                                throw IllegalStateException("Audio line for format $targetFormat is not supported")
                            }

                            currentClip = (AudioSystem.getLine(info) as Clip).apply {
                                open(stream)
                                start()
                            }

                            println("🔊 Playing voice audio with decoded format $targetFormat")

                            while (currentClip?.isRunning == true) {
                                delay(100)
                            }
                        }
                    } finally {
                        if (playbackStream !== rawStream) {
                            rawStream.close()
                        }
                    }
                }

                currentClip?.let { clip ->
                    if (clip.isRunning) {
                        clip.stop()
                    }
                    clip.close()
                }
                currentClip = null
                println("✅ Audio playback complete")

            } catch (e: Exception) {
                println("❌ Audio playback failed for $nextUrl: ${e.message}")
                e.printStackTrace()
                stopCurrentAudio()
            } finally {
                playNext()
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

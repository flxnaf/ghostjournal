package com.digitaltwins

import java.io.File
import java.util.Properties

/**
 * Configuration manager for Digital Twins mod
 * Reads from config/digitaltwins.properties in Minecraft directory
 */
object TwinConfig {
    private val configFile = File("config/digitaltwins.properties")
    private val properties = Properties()
    
    init {
        loadConfig()
    }
    
    private fun loadConfig() {
        try {
            if (configFile.exists()) {
                configFile.inputStream().use { input ->
                    properties.load(input)
                }
                println("✅ Loaded config from: ${configFile.absolutePath}")
            } else {
                println("⚠️ Config file not found, creating default...")
                createDefaultConfig()
            }
        } catch (e: Exception) {
            println("❌ Failed to load config: ${e.message}")
            createDefaultConfig()
        }
    }
    
    private fun createDefaultConfig() {
        try {
            configFile.parentFile?.mkdirs()
            configFile.writeText("""
# Digital Twins Minecraft Mod Configuration
# https://replik.tech

# Fish Audio API Key (REQUIRED for voice)
# Get your key from: https://fish.audio
# If not set, voices won't work (you'll get 402 errors)
fishAudioApiKey=

# Default voice if no trained model exists
# This is a neutral English voice from Fish Audio
defaultVoiceId=af1ddb5dc0e644ebb16b58ed466e27c6

# API Base URL (usually your deployed site)
# Example: https://replik.tech or http://localhost:3000
apiBaseUrl=https://replik.tech
            """.trimIndent())
            println("✅ Created default config at: ${configFile.absolutePath}")
            println("⚠️ PLEASE EDIT THE CONFIG FILE AND ADD YOUR FISH AUDIO API KEY!")
        } catch (e: Exception) {
            println("❌ Failed to create config: ${e.message}")
        }
    }
    
    /**
     * Get Fish Audio API key from config file or environment variable
     * Priority: Config file > Environment variable > Hardcoded fallback
     */
    fun getFishAudioApiKey(): String {
        // Try config file first
        val configKey = properties.getProperty("fishAudioApiKey", "").trim()
        if (configKey.isNotEmpty()) {
            println("✅ Using Fish Audio API key from config file")
            return configKey
        }
        
        // Try environment variable
        val envKey = System.getenv("FISH_AUDIO_API_KEY")
        if (!envKey.isNullOrEmpty()) {
            println("✅ Using Fish Audio API key from environment variable")
            return envKey
        }
        
        // Fallback (likely out of credits)
        println("⚠️ No API key configured! Using fallback (likely won't work)")
        println("   Edit config/digitaltwins.properties and add your Fish Audio API key")
        return "dd66b6dad1214de68bd1fa9cd28f3c55"
    }
    
    fun getDefaultVoiceId(): String {
        return properties.getProperty("defaultVoiceId", "af1ddb5dc0e644ebb16b58ed466e27c6")
    }
    
    fun getApiBaseUrl(): String {
        return properties.getProperty("apiBaseUrl", "https://replik.tech")
    }
    
    /**
     * Reload config from file (useful for runtime changes)
     */
    fun reload() {
        properties.clear()
        loadConfig()
    }
}


package com.digitaltwins

import net.minecraft.client.MinecraftClient
import net.minecraft.client.texture.NativeImage
import net.minecraft.client.texture.NativeImageBackedTexture
import net.minecraft.util.Identifier
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayInputStream
import java.util.concurrent.ConcurrentHashMap

/**
 * Downloads and caches Minecraft skins
 */
object SkinCache {
    private val client = OkHttpClient()
    private val cache = ConcurrentHashMap<String, Identifier>()

    /**
     * Get skin identifier, downloading if necessary
     * Returns Steve skin as fallback
     */
    fun getSkin(skinUrl: String?, entityName: String): Identifier {
        // No skin URL - use Steve
        if (skinUrl.isNullOrEmpty()) {
            println("🎨 No skin URL provided, using Steve")
            return Identifier("minecraft", "textures/entity/steve.png")
        }

        // Check cache
        cache[skinUrl]?.let {
            println("✅ Skin loaded from cache")
            return it
        }

        // Download and register
        try {
            println("📥 Downloading skin from: ${skinUrl.substring(0, 50)}...")
            val skinId = Identifier("digitaltwins", "skins/${entityName.lowercase().replace(" ", "_")}")

            // Download skin texture
            val request = Request.Builder()
                .url(skinUrl)
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                println("❌ Failed to download skin: HTTP ${response.code}")
                return Identifier("minecraft", "textures/entity/steve.png")
            }

            // Load image
            val imageBytes = response.body?.bytes()
            if (imageBytes == null) {
                println("❌ No image data received")
                return Identifier("minecraft", "textures/entity/steve.png")
            }

            println("✅ Downloaded ${imageBytes.size} bytes")

            val image = NativeImage.read(ByteArrayInputStream(imageBytes))

            // Register texture on main thread
            MinecraftClient.getInstance().execute {
                try {
                    val texture = NativeImageBackedTexture(image)
                    MinecraftClient.getInstance().textureManager.registerTexture(skinId, texture)
                    println("✅ Registered skin texture: $skinId")
                } catch (e: Exception) {
                    println("❌ Failed to register texture: ${e.message}")
                }
            }

            // Cache it
            cache[skinUrl] = skinId
            println("✅ Skin cached successfully")

            return skinId

        } catch (e: Exception) {
            println("❌ Failed to download skin: ${e.message}")
            e.printStackTrace()
            return Identifier("minecraft", "textures/entity/steve.png")
        }
    }

    /**
     * Clear skin cache
     */
    fun clearCache() {
        cache.clear()
        println("🗑️ Skin cache cleared")
    }
}

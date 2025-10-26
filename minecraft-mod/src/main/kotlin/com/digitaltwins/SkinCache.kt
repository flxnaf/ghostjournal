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
            println("   Full URL: $skinUrl")
            println("   Entity name: $entityName")
            
            val skinId = Identifier("digitaltwins", "skins/${entityName.lowercase().replace(" ", "_")}")

            // Download skin texture with timeout
            val request = Request.Builder()
                .url(skinUrl)
                .build()

            println("🌐 Attempting HTTP request...")
            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                println("❌ Failed to download skin: HTTP ${response.code}")
                println("   Response message: ${response.message}")
                println("   ⚠️ Check your internet connection!")
                return Identifier("minecraft", "textures/entity/steve.png")
            }

            // Load image
            val imageBytes = response.body?.bytes()
            if (imageBytes == null || imageBytes.isEmpty()) {
                println("❌ No image data received")
                return Identifier("minecraft", "textures/entity/steve.png")
            }

            println("✅ Downloaded ${imageBytes.size} bytes")

            val image = NativeImage.read(ByteArrayInputStream(imageBytes))
            println("✅ Image parsed: ${image.width}x${image.height}")

            // Register texture on main thread
            MinecraftClient.getInstance().execute {
                try {
                    val texture = NativeImageBackedTexture(image)
                    MinecraftClient.getInstance().textureManager.registerTexture(skinId, texture)
                    println("✅ Registered skin texture: $skinId")
                } catch (e: Exception) {
                    println("❌ Failed to register texture: ${e.message}")
                    e.printStackTrace()
                }
            }

            // Cache it
            cache[skinUrl] = skinId
            println("✅ Skin cached successfully")

            return skinId

        } catch (e: java.net.UnknownHostException) {
            println("❌ No internet connection - cannot download skin")
            println("   Entity will use Steve skin")
            return Identifier("minecraft", "textures/entity/steve.png")
        } catch (e: java.net.SocketTimeoutException) {
            println("❌ Connection timeout - check your internet")
            return Identifier("minecraft", "textures/entity/steve.png")
        } catch (e: Exception) {
            println("❌ Failed to download skin: ${e.message}")
            println("   Exception type: ${e.javaClass.simpleName}")
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

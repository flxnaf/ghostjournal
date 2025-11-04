package com.digitaltwins

import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * HTTP client for communicating with the Digital Twins web API
 */
object TwinAPI {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    /**
     * Twin data structure from export API
     */
    data class TwinData(
        val twin_id: String,
        val username: String?,
        val name: String,
        val display_name: String,
        val voice_model_id: String?,
        val minecraft_username: String?,
        val minecraft_skin_url: String?,
        val api_endpoint: String,
        val created_at: String
    )

    /**
     * Request structure for chat API
     */
    data class ChatRequest(
        val userId: String,
        val message: String
    )

    /**
     * Response structure from chat API
     */
    data class ChatResponse(
        val text: String,  // API returns "text" field, not "responseText"
        val audioUrl: String? = null,
        val success: Boolean? = null  // API also returns success field
    )

    /**
     * Download twin data from URL or file
     */
    fun downloadTwin(urlOrPath: String): TwinData {
        return if (urlOrPath.startsWith("http")) {
            // Download from URL
            val request = Request.Builder()
                .url(urlOrPath)
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                throw Exception("Failed to download twin: ${response.code}")
            }

            gson.fromJson(response.body?.string(), TwinData::class.java)
        } else {
            // Read from file
            val file = File(urlOrPath)
            if (!file.exists()) {
                throw Exception("File not found: $urlOrPath")
            }

            gson.fromJson(file.readText(), TwinData::class.java)
        }
    }

    /**
     * Send a message to a twin and get response
     */
    fun sendMessage(apiEndpoint: String, twinId: String, message: String): ChatResponse {
        val requestData = ChatRequest(twinId, message)
        val json = gson.toJson(requestData)
        val body = json.toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(apiEndpoint)
            .post(body)
            .build()

        val response = client.newCall(request).execute()

        if (!response.isSuccessful) {
            throw Exception("API request failed: ${response.code}")
        }

        return gson.fromJson(response.body?.string(), ChatResponse::class.java)
    }

    /**
     * Fetch Minecraft skin URL from Mojang API
     */
    fun fetchMinecraftSkin(minecraftUsername: String): String? {
        try {
            // Step 1: Get UUID from username
            val uuidRequest = Request.Builder()
                .url("https://api.mojang.com/users/profiles/minecraft/$minecraftUsername")
                .build()

            val uuidResponse = client.newCall(uuidRequest).execute()
            if (!uuidResponse.isSuccessful) {
                return null
            }

            val uuidJson = gson.fromJson(uuidResponse.body?.string(), Map::class.java)
            val uuid = uuidJson["id"] as? String ?: return null

            // Step 2: Get profile with skin data
            val profileRequest = Request.Builder()
                .url("https://sessionserver.mojang.com/session/minecraft/profile/$uuid")
                .build()

            val profileResponse = client.newCall(profileRequest).execute()
            if (!profileResponse.isSuccessful) {
                return null
            }

            val profileJson = gson.fromJson(profileResponse.body?.string(), Map::class.java)
            val properties = profileJson["properties"] as? List<*> ?: return null

            // Step 3: Decode skin URL from base64 textures
            val texturesProperty = properties.find { prop ->
                (prop as? Map<*, *>)?.get("name") == "textures"
            } as? Map<*, *> ?: return null

            val texturesValue = texturesProperty["value"] as? String ?: return null
            val decodedTextures = String(java.util.Base64.getDecoder().decode(texturesValue))
            val texturesJson = gson.fromJson(decodedTextures, Map::class.java)

            @Suppress("UNCHECKED_CAST")
            val textures = texturesJson["textures"] as? Map<String, *>
            @Suppress("UNCHECKED_CAST")
            val skin = textures?.get("SKIN") as? Map<String, *>
            val skinUrl = skin?.get("url") as? String

            return skinUrl

        } catch (e: Exception) {
            println("❌ Failed to fetch Minecraft skin: ${e.message}")
            return null
        }
    }
}

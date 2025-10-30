package com.digitaltwins

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import net.fabricmc.loader.api.FabricLoader
import java.io.File

/**
 * Manages persistent storage of imported twins
 */
object TwinStorage {
    private val configDir = FabricLoader.getInstance().configDir.toFile().resolve("digitaltwins")
    private val twinsFile = configDir.resolve("twins.json")
    private val gson = Gson()

    init {
        // Ensure config directory exists
        if (!configDir.exists()) {
            configDir.mkdirs()
        }
    }

    /**
     * Save twins to disk
     */
    fun save(twins: List<TwinAPI.TwinData>) {
        val json = gson.toJson(twins)
        twinsFile.writeText(json)
    }

    /**
     * Load twins from disk
     */
    fun load(): List<TwinAPI.TwinData> {
        if (!twinsFile.exists()) {
            return emptyList()
        }

        val json = twinsFile.readText()
        val type = object : TypeToken<List<TwinAPI.TwinData>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    /**
     * Add a new twin (or update if exists)
     */
    fun addTwin(twin: TwinAPI.TwinData) {
        val twins = load().toMutableList()

        // Remove existing twin with same ID
        twins.removeAll { it.twin_id == twin.twin_id }

        // Add new twin
        twins.add(twin)

        save(twins)
    }

    /**
     * Get twin by name
     */
    fun getTwinByName(name: String): TwinAPI.TwinData? {
        println("🔍 TwinStorage.getTwinByName called with: $name")
        val twins = load()
        println("   Available twins: ${twins.map { it.name }}")
        val result = twins.find { it.name.equals(name, ignoreCase = true) }
        println("   Result: ${if (result != null) "Found: ${result.display_name}" else "Not found"}")
        return result
    }

    /**
     * Get twin by username (Replik username)
     */
    fun getTwinByUsername(username: String): TwinAPI.TwinData? {
        println("🔍 TwinStorage.getTwinByUsername called with: $username")
        val twins = load()
        println("   Available usernames: ${twins.map { it.username }}")
        val result = twins.find { it.username?.equals(username, ignoreCase = true) == true }
        println("   Result: ${if (result != null) "Found: ${result.display_name}" else "Not found"}")
        return result
    }

    /**
     * Get all twin names
     */
    fun getAllTwinNames(): List<String> {
        return load().map { it.name }
    }
}

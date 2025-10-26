package com.digitaltwins

import com.digitaltwins.advanced.entity.ModEntities
import com.digitaltwins.advanced.entity.TwinEntity
import com.digitaltwins.advanced.network.PacketHandler
import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.arguments.StringArgumentType
import com.mojang.brigadier.context.CommandContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import net.minecraft.server.command.CommandManager.argument
import net.minecraft.server.command.CommandManager.literal
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.Text
import java.util.concurrent.ConcurrentHashMap

/**
 * Handles all twin-related commands
 */
object TwinCommands {

    // Track spawned TwinEntity instances by name
    private val spawnedEntities = ConcurrentHashMap<String, TwinEntity>()

    fun register(dispatcher: CommandDispatcher<ServerCommandSource>) {
        // /twinimport <url-or-path>
        dispatcher.register(
            literal("twinimport")
                .then(
                    argument("url", StringArgumentType.greedyString())
                        .executes { context ->
                            val url = StringArgumentType.getString(context, "url")
                            importTwin(context, url)
                            1
                        }
                )
        )

        // /twinlist
        dispatcher.register(
            literal("twinlist")
                .executes { context ->
                    listTwins(context)
                    1
                }
        )

        // /twinspawn <name>
        dispatcher.register(
            literal("twinspawn")
                .then(
                    argument("name", StringArgumentType.word())
                        .executes { context ->
                            val name = StringArgumentType.getString(context, "name")
                            spawnTwin(context, name)
                            1
                        }
                )
        )

        // /twin <name> <message>
        dispatcher.register(
            literal("twin")
                .then(
                    argument("name", StringArgumentType.word())
                        .then(
                            argument("message", StringArgumentType.greedyString())
                                .executes { context ->
                                    val name = StringArgumentType.getString(context, "name")
                                    val message = StringArgumentType.getString(context, "message")
                                    chatWithTwin(context, name, message)
                                    1
                                }
                        )
                )
        )

        // /twinremove <name>
        dispatcher.register(
            literal("twinremove")
                .then(
                    argument("name", StringArgumentType.word())
                        .executes { context ->
                            val name = StringArgumentType.getString(context, "name")
                            removeTwin(context, name)
                            1
                        }
                )
        )
    }

    /**
     * Import a twin from URL, username, or file path
     *
     * Supports:
     * - Full URL: https://replik.tech/api/minecraft/export/USER_ID
     * - Username with @: @alex
     * - Username without @: alex
     */
    private fun importTwin(context: CommandContext<ServerCommandSource>, urlOrUsername: String) {
        val player = context.source.player ?: return

        // Determine the final URL
        val finalUrl = when {
            // Full URL provided
            urlOrUsername.startsWith("http") -> urlOrUsername

            // UUID format (8-4-4-4-12 with hyphens) - matches standard UUID pattern
            urlOrUsername.matches(Regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", RegexOption.IGNORE_CASE)) -> {
                "https://replik.tech/api/minecraft/export/$urlOrUsername"
            }

            // Username with @ prefix
            urlOrUsername.startsWith("@") -> {
                val username = urlOrUsername.substring(1)
                "https://replik.tech/api/minecraft/export/username/$username"
            }

            // Plain username (not a UUID, no slashes or dots)
            !urlOrUsername.contains("/") && !urlOrUsername.contains(".") -> {
                "https://replik.tech/api/minecraft/export/username/$urlOrUsername"
            }

            // File path or other
            else -> urlOrUsername
        }

        // Show loading message
        player.sendMessage(Text.literal("§e⏳ Downloading twin data..."), false)

        // Download async to not block game
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val twinData = TwinAPI.downloadTwin(finalUrl)
                TwinStorage.addTwin(twinData)

                // Success message on main thread
                player.server.execute {
                    player.sendMessage(
                        Text.literal("§a✓ Loaded twin: ${twinData.display_name}"),
                        false
                    )

                    // Show skin status if available
                    if (!twinData.minecraft_skin_url.isNullOrEmpty()) {
                        player.sendMessage(
                            Text.literal("§7   Minecraft skin: ${twinData.minecraft_username}"),
                            false
                        )
                    }
                }
            } catch (e: Exception) {
                player.server.execute {
                    player.sendMessage(
                        Text.literal("§c✗ Failed to import twin: ${e.message}"),
                        false
                    )
                }
            }
        }
    }

    /**
     * List all imported twins
     */
    private fun listTwins(context: CommandContext<ServerCommandSource>) {
        val player = context.source.player ?: return
        val twins = TwinStorage.load()

        if (twins.isEmpty()) {
            player.sendMessage(Text.literal("§eNo twins imported. Use /twinimport <url>"), false)
            return
        }

        player.sendMessage(Text.literal("§b=== Imported Twins ==="), false)
        twins.forEach { twin ->
            val spawned = if (isSpawned(twin.name)) "§a(Spawned)" else "§7(Not spawned)"
            player.sendMessage(Text.literal("§f- ${twin.display_name} $spawned"), false)
        }
    }

    /**
     * Spawn a twin NPC in the world as a TwinEntity (player model with AI)
     */
    private fun spawnTwin(context: CommandContext<ServerCommandSource>, name: String) {
        val player = context.source.player ?: return
        val world = player.serverWorld

        // Check if already spawned
        if (isSpawned(name)) {
            player.sendMessage(
                Text.literal("§e${name} is already spawned! Use /twinremove first."),
                false
            )
            return
        }

        // Get twin data
        val twinData = TwinStorage.getTwinByName(name)
        if (twinData == null) {
            player.sendMessage(
                Text.literal("§cTwin not found: $name. Use /twinimport first."),
                false
            )
            return
        }

        val pos = player.blockPos

        // Try to spawn as TwinEntity (Advanced Edition with AI and skins)
        val twinEntity = try {
            ModEntities.TWIN_ENTITY.create(world)
        } catch (e: Exception) {
            println("⚠️ TwinEntity creation failed: ${e.message}")
            null
        }

        if (twinEntity != null) {
            // SUCCESS: Spawn as Advanced Edition (player model with AI)
            try {
                twinEntity.setTwinData(name)
                twinEntity.refreshPositionAndAngles(
                    pos.x + 0.5,
                    pos.y.toDouble(),
                    pos.z + 0.5,
                    player.yaw,
                    0f
                )
                world.spawnEntity(twinEntity)
                spawnedEntities[name] = twinEntity

                player.sendMessage(
                    Text.literal("§a✓ Spawned ${twinData.display_name} (Advanced Edition)"),
                    false
                )
                player.sendMessage(
                    Text.literal("§7Right-click to chat, or use: /twin ${twinData.name} <message>"),
                    false
                )
                println("✅ Spawned TwinEntity with custom skin and AI")
            } catch (e: Exception) {
                println("⚠️ TwinEntity spawn failed, falling back to MVP: ${e.message}")
                // Fallback to MVP if Advanced Edition fails
                TwinNPC.spawn(world, pos, twinData)
                player.sendMessage(
                    Text.literal("§a✓ Spawned ${twinData.display_name} (Villager Mode)"),
                    false
                )
                player.sendMessage(
                    Text.literal("§7Chat with: /twin ${twinData.name} <message>"),
                    false
                )
            }
        } else {
            // FALLBACK: Spawn as MVP Mode (villager)
            println("⚠️ TwinEntity not available, using MVP villager")
            TwinNPC.spawn(world, pos, twinData)
            player.sendMessage(
                Text.literal("§a✓ Spawned ${twinData.display_name} (Villager Mode)"),
                false
            )
            player.sendMessage(
                Text.literal("§7Chat with: /twin ${twinData.name} <message>"),
                false
            )
        }
    }

    /**
     * Send a message to a twin and play voice response
     * Send a message to a twin
     */
    private fun chatWithTwin(context: CommandContext<ServerCommandSource>, name: String, message: String) {
        val player = context.source.player ?: return

        // Get twin data
        val twinData = TwinStorage.getTwinByName(name)
        if (twinData == null) {
            player.sendMessage(
                Text.literal("§cTwin not found: $name"),
                false
            )
            return
        }

        // Show thinking message
        player.sendMessage(
            Text.literal("§e${twinData.display_name} is thinking..."),
            false
        )

        // Send to API async
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = TwinAPI.sendMessage(
                    twinData.api_endpoint,
                    twinData.twin_id,
                    message
                )

                // Show response on main thread
                player.server.execute {
                    player.sendMessage(
                        Text.literal("§b[${twinData.display_name}]§f ${response.text}"),
                        false
                    )

                    // NEW: Play voice audio if available
                    if (!response.audioUrl.isNullOrEmpty()) {
                        // Build full URL if it's a relative path
                        val fullAudioUrl = if (response.audioUrl.startsWith("http")) {
                            response.audioUrl
                        } else {
                            // Extract base URL from api_endpoint
                            val baseUrl = twinData.api_endpoint.replace("/api/speak", "")
                            "$baseUrl${response.audioUrl}"
                        }

                        player.sendMessage(
                            Text.literal("§a🔊 Playing voice..."),
                            false
                        )

                        // Play audio on the client that initiated the conversation
                        PacketHandler.sendPlayAudio(player, fullAudioUrl)
                    }
                }
            } catch (e: Exception) {
                player.server.execute {
                    player.sendMessage(
                        Text.literal("§c✗ Failed to get response: ${e.message}"),
                        false
                    )
                    player.sendMessage(
                        Text.literal("§7Check your internet connection and API endpoint."),
                        false
                    )
                }
            }
        }
    }

    /**
     * Despawn a twin NPC (works for both Advanced Edition and MVP Mode)
     */
    private fun removeTwin(context: CommandContext<ServerCommandSource>, name: String) {
        val player = context.source.player ?: return

        if (!isSpawned(name)) {
            player.sendMessage(
                Text.literal("§e$name is not currently spawned."),
                false
            )
            return
        }

        // Try to remove TwinEntity first (Advanced Edition)
        val removedEntity = spawnedEntities[name]?.let { entity ->
            entity.discard()
            spawnedEntities.remove(name)
            true
        } ?: false

        // If not found as TwinEntity, try MVP villager fallback
        if (!removedEntity && TwinNPC.isSpawned(name)) {
            TwinNPC.despawn(name)
        }

        player.sendMessage(
            Text.literal("§a✓ Despawned $name"),
            false
        )
    }

    /**
     * Check if a twin is currently spawned (checks both systems)
     */
    private fun isSpawned(name: String): Boolean {
        // Check Advanced Edition entity
        if (spawnedEntities[name]?.isAlive == true) {
            return true
        }
        // Check MVP villager fallback
        return TwinNPC.isSpawned(name)
    }
}

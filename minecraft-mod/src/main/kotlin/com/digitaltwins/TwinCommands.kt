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

        // /twinspawn <replikUsername> [minecraftUsername]
        dispatcher.register(
            literal("twinspawn")
                .then(
                    argument("replikUsername", StringArgumentType.word())
                        .executes { context ->
                            val replikUsername = StringArgumentType.getString(context, "replikUsername")
                            spawnTwin(context, replikUsername, null)
                            1
                        }
                        .then(
                            argument("minecraftUsername", StringArgumentType.word())
                                .executes { context ->
                                    val replikUsername = StringArgumentType.getString(context, "replikUsername")
                                    val minecraftUsername = StringArgumentType.getString(context, "minecraftUsername")
                                    spawnTwin(context, replikUsername, minecraftUsername)
                                    1
                                }
                        )
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

            // Username with @ prefix
            urlOrUsername.startsWith("@") -> {
                val username = urlOrUsername.substring(1)
                "https://replik.tech/api/minecraft/export/username/$username"
            }

            // Plain username (assume it's a username, not a UUID)
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
     * @param replikUsername The Replik clone username to spawn
     * @param minecraftUsername Optional Minecraft username to use for the skin
     */
    private fun spawnTwin(context: CommandContext<ServerCommandSource>, replikUsername: String, minecraftUsername: String?) {
        val player = context.source.player ?: return
        val world = player.serverWorld

        // Get twin data first (first check by username, then by name)
        val twinData = TwinStorage.getTwinByUsername(replikUsername) ?: TwinStorage.getTwinByName(replikUsername)
        if (twinData == null) {
            player.sendMessage(
                Text.literal("§cTwin not found: $replikUsername. Use /twinimport <username> first."),
                false
            )
            return
        }

        // Check if already spawned using the twin's actual name
        if (isSpawned(twinData.name)) {
            player.sendMessage(
                Text.literal("§e${twinData.display_name} is already spawned! Use /twinremove first."),
                false
            )
            return
        }

        // Create and spawn TwinEntity
        val twinEntity = try {
            // Check if entity type is initialized
            try {
                val entityType = ModEntities.TWIN_ENTITY
                println("🔧 Creating entity with type: $entityType")
                entityType.create(world)
            } catch (e: UninitializedPropertyAccessException) {
                player.sendMessage(
                    Text.literal("§c✗ Entity type not initialized! Mod didn't load correctly."),
                    false
                )
                println("❌ TWIN_ENTITY not initialized!")
                return
            }
        } catch (e: Exception) {
            player.sendMessage(
                Text.literal("§c✗ Failed to create twin entity: ${e.message}"),
                false
            )
            println("❌ Full error:")
            e.printStackTrace()
            return
        }
        
        if (twinEntity == null) {
            player.sendMessage(
                Text.literal("§cFailed to create twin entity (null returned)"),
                false
            )
            return
        }

        // Set twin data
        try {
            twinEntity.setTwinData(twinData.name)
            player.sendMessage(
                Text.literal("§7Debug: Twin data set successfully"),
                false
            )
        } catch (e: Exception) {
            player.sendMessage(
                Text.literal("§c✗ Failed to set twin data: ${e.message}"),
                false
            )
            e.printStackTrace()
            twinEntity.discard()
            return
        }
        
        // Set position
        val pos = player.blockPos
        twinEntity.refreshPositionAndAngles(
            pos.x + 0.5,
            pos.y.toDouble(),
            pos.z + 0.5,
            player.yaw,
            0f
        )

        // Spawn entity in world
        world.spawnEntity(twinEntity)
        spawnedEntities[twinData.name] = twinEntity

        player.sendMessage(
            Text.literal("§a✓ Spawned ${twinData.display_name} at your location!"),
            false
        )
        
        player.sendMessage(
            Text.literal("§7Right-click to chat, or use: /twin ${twinData.username ?: twinData.name} <message>"),
            false
        )
        
        // If Minecraft username provided, fetch and apply skin AFTER spawning
        if (minecraftUsername != null) {
            player.sendMessage(
                Text.literal("§e⏳ Fetching Minecraft skin for $minecraftUsername..."),
                false
            )
            
            // Fetch skin async to not block
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val skinUrl = TwinAPI.fetchMinecraftSkin(minecraftUsername)
                    if (skinUrl != null) {
                        // Apply skin on main thread
                        player.server.execute {
                            twinEntity.setMinecraftSkin(skinUrl)
                            player.sendMessage(
                                Text.literal("§a✓ Applied skin from $minecraftUsername"),
                                false
                            )
                        }
                    } else {
                        player.server.execute {
                            player.sendMessage(
                                Text.literal("§e⚠ Could not fetch skin for $minecraftUsername, using default"),
                                false
                            )
                        }
                    }
                } catch (e: Exception) {
                    player.server.execute {
                        player.sendMessage(
                            Text.literal("§e⚠ Skin fetch failed: ${e.message}"),
                            false
                        )
                    }
                }
            }
        }
    }

    /**
     * Send a message to a twin and play voice response
     * @param usernameOrName Can be either Replik username or display name
     */
    private fun chatWithTwin(context: CommandContext<ServerCommandSource>, usernameOrName: String, message: String) {
        val player = context.source.player ?: return

        // Get twin data (first check by username, then by name)
        val twinData = TwinStorage.getTwinByUsername(usernameOrName) ?: TwinStorage.getTwinByName(usernameOrName)
        if (twinData == null) {
            player.sendMessage(
                Text.literal("§cTwin not found: $usernameOrName. Use /twinimport <username> first."),
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
     * Despawn a twin NPC
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

        // Remove and discard entity
        spawnedEntities[name]?.let { entity ->
            entity.discard()
            spawnedEntities.remove(name)
        }

        player.sendMessage(
            Text.literal("§a✓ Despawned $name"),
            false
        )
    }

    /**
     * Check if a twin is currently spawned
     */
    private fun isSpawned(name: String): Boolean {
        return spawnedEntities[name]?.isAlive == true
    }
}

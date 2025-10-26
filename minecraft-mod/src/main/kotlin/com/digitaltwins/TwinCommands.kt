package com.digitaltwins

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

/**
 * Handles all twin-related commands
 */
object TwinCommands {

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
     * Import a twin from URL or file path
     */
    private fun importTwin(context: CommandContext<ServerCommandSource>, url: String) {
        val player = context.source.player ?: return

        // Show loading message
        player.sendMessage(Text.literal("§e⏳ Downloading twin data..."), false)

        // Download async to not block game
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val twinData = TwinAPI.downloadTwin(url)
                TwinStorage.addTwin(twinData)

                // Success message on main thread
                player.server.execute {
                    player.sendMessage(
                        Text.literal("§a✓ Loaded twin: ${twinData.display_name}"),
                        false
                    )
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
            val spawned = if (TwinNPC.isSpawned(twin.name)) "§a(Spawned)" else "§7(Not spawned)"
            player.sendMessage(Text.literal("§f- ${twin.display_name} $spawned"), false)
        }
    }

    /**
     * Spawn a twin NPC in the world
     */
    private fun spawnTwin(context: CommandContext<ServerCommandSource>, name: String) {
        val player = context.source.player ?: return
        val world = player.serverWorld

        // Check if already spawned
        if (TwinNPC.isSpawned(name)) {
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

        // Spawn at player's location
        val pos = player.blockPos
        TwinNPC.spawn(world, pos, twinData)

        player.sendMessage(
            Text.literal("§a✓ Spawned ${twinData.display_name} at your location!"),
            false
        )
        player.sendMessage(
            Text.literal("§7Chat with: /twin ${twinData.name} <message>"),
            false
        )
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

                        // Play audio in background
                        TwinAudioPlayer.playAudioFromUrl(fullAudioUrl)
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

        if (!TwinNPC.isSpawned(name)) {
            player.sendMessage(
                Text.literal("§e$name is not currently spawned."),
                false
            )
            return
        }

        TwinNPC.despawn(name)
        player.sendMessage(
            Text.literal("§a✓ Despawned $name"),
            false
        )
    }
}

package com.digitaltwins

import com.digitaltwins.advanced.entity.ModEntities
import com.digitaltwins.advanced.item.ModItems
import com.digitaltwins.advanced.network.PacketHandler
import net.fabricmc.api.ModInitializer
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback
import org.slf4j.LoggerFactory

/**
 * Digital Twins Minecraft Mod
 *
 * Supports two modes:
 * - MVP Mode: Commands + voice playback (TwinCommands)
 * - Advanced Mode: Custom entities + GUI + spawn eggs
 */
object DigitalTwinsMod : ModInitializer {
    const val MOD_ID = "digitaltwins"
    val LOGGER = LoggerFactory.getLogger(MOD_ID)

    override fun onInitialize() {
        LOGGER.info("Digital Twins Mod initialized!")

        // Register MVP Mode commands
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            TwinCommands.register(dispatcher)
        }

        // Register Advanced Edition features
        ModEntities.register()
        ModItems.register()
        PacketHandler.registerServer()

        LOGGER.info("Digital Twins Mod loaded successfully!")
    }
}

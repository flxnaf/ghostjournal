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
        LOGGER.info("Digital Twins Mod initializing...")

        // Register Advanced Edition features FIRST
        LOGGER.info("Step 1: Registering entities...")
        ModEntities.register()
        
        LOGGER.info("Step 2: Registering items...")
        ModItems.register()
        
        LOGGER.info("Step 3: Registering network packets...")
        PacketHandler.registerServer()

        // Register MVP Mode commands AFTER entities are registered
        LOGGER.info("Step 4: Registering commands...")
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            TwinCommands.register(dispatcher)
        }

        LOGGER.info("✅ Digital Twins Mod loaded successfully!")
        LOGGER.warn("⚠️ Note: Entity attributes not fully registered - this may cause spawn issues")
    }
}

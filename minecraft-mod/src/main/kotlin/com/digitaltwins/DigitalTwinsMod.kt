package com.digitaltwins

import net.fabricmc.api.ModInitializer
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback
import org.slf4j.LoggerFactory

object DigitalTwinsMod : ModInitializer {
    const val MOD_ID = "digitaltwins"
    val LOGGER = LoggerFactory.getLogger(MOD_ID)

    override fun onInitialize() {
        LOGGER.info("Digital Twins Mod initialized!")

        // Register commands
        CommandRegistrationCallback.EVENT.register { dispatcher, _, _ ->
            TwinCommands.register(dispatcher)
        }
    }
}

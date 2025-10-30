package com.digitaltwins

import com.digitaltwins.advanced.client.TwinRenderer
import com.digitaltwins.advanced.entity.ModEntities
import com.digitaltwins.advanced.network.PacketHandler
import net.fabricmc.api.ClientModInitializer
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry

/**
 * Client-side initialization for Digital Twins Mod
 */
object DigitalTwinsModClient : ClientModInitializer {

    override fun onInitializeClient() {
        DigitalTwinsMod.LOGGER.info("Digital Twins Mod - Client initialized!")

        // Register entity renderers
        EntityRendererRegistry.register(ModEntities.TWIN_ENTITY, ::TwinRenderer)

        // Register client-side network packet handlers
        PacketHandler.registerClient()

        DigitalTwinsMod.LOGGER.info("Digital Twins Mod - Client loaded successfully!")
    }
}

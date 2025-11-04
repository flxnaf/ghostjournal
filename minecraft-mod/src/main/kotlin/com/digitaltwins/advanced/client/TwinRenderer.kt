package com.digitaltwins.advanced.client

import com.digitaltwins.SkinCache
import com.digitaltwins.advanced.entity.TwinEntity
import net.minecraft.client.render.entity.EntityRendererFactory
import net.minecraft.client.render.entity.MobEntityRenderer
import net.minecraft.client.render.entity.model.EntityModelLayers
import net.minecraft.client.render.entity.model.PlayerEntityModel
import net.minecraft.util.Identifier

/**
 * Renderer for TwinEntity - uses player model with custom Minecraft skins
 */
class TwinRenderer(context: EntityRendererFactory.Context) :
    MobEntityRenderer<TwinEntity, PlayerEntityModel<TwinEntity>>(
        context,
        PlayerEntityModel(context.getPart(EntityModelLayers.PLAYER), false),
        0.5f
    ) {

    /**
     * Get texture for the entity
     * Uses user's Minecraft skin if linked, otherwise Steve
     */
    override fun getTexture(entity: TwinEntity): Identifier {
        // Debug output
        println("🎨 TwinRenderer.getTexture() called")
        println("   Entity: ${entity.twinDisplayName}")
        println("   Skin URL: ${entity.minecraftSkinUrl ?: "NULL"}")
        
        // Use Minecraft skin if available, fallback to Steve
        return try {
            val skinId = SkinCache.getSkin(
                entity.minecraftSkinUrl,
                entity.twinName
            )
            println("   Returning texture: $skinId")
            skinId
        } catch (e: Exception) {
            println("❌ Failed to get skin for ${entity.twinName}: ${e.message}")
            e.printStackTrace()
            // Return Steve as absolute fallback
            val fallback = Identifier("minecraft", "textures/entity/player/wide/steve.png")
            println("   Using fallback: $fallback")
            fallback
        }
    }
}

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
        // Use Minecraft skin if available, fallback to Steve
        return try {
            SkinCache.getSkin(
                entity.minecraftSkinUrl,
                entity.twinName
            )
        } catch (e: Exception) {
            println("❌ Failed to get skin for ${entity.twinName}: ${e.message}")
            // Return Steve as absolute fallback
            Identifier("minecraft", "textures/entity/steve.png")
        }
    }
}

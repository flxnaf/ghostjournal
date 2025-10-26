package com.digitaltwins.advanced.client

import com.digitaltwins.DigitalTwinsMod
import com.digitaltwins.advanced.entity.TwinEntity
import net.minecraft.client.render.entity.EntityRendererFactory
import net.minecraft.client.render.entity.MobEntityRenderer
import net.minecraft.client.render.entity.model.EntityModelLayers
import net.minecraft.client.render.entity.model.PlayerEntityModel
import net.minecraft.util.Identifier

/**
 * Renderer for TwinEntity - uses player model for familiar appearance
 */
class TwinRenderer(context: EntityRendererFactory.Context) :
    MobEntityRenderer<TwinEntity, PlayerEntityModel<TwinEntity>>(
        context,
        PlayerEntityModel(context.getPart(EntityModelLayers.PLAYER), false),
        0.5f
    ) {

    /**
     * Get texture for the entity
     * Using default Steve skin for now
     * TODO: Could load custom skins from twin face data
     */
    override fun getTexture(entity: TwinEntity): Identifier {
        // Use default Steve skin
        // In future, could generate custom texture from face data
        return Identifier("minecraft", "textures/entity/steve.png")
    }
}

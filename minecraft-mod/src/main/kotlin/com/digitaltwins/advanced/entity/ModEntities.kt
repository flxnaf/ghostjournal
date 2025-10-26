package com.digitaltwins.advanced.entity

import com.digitaltwins.DigitalTwinsMod
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricEntityTypeBuilder
import net.minecraft.entity.EntityDimensions
import net.minecraft.entity.EntityType
import net.minecraft.entity.SpawnGroup
import net.minecraft.registry.Registries
import net.minecraft.registry.Registry
import net.minecraft.util.Identifier

/**
 * Registers custom entity types for the Advanced Edition
 */
object ModEntities {

    /**
     * Twin entity type - a custom mob that represents a digital twin
     */
    val TWIN_ENTITY: EntityType<TwinEntity> = Registry.register(
        Registries.ENTITY_TYPE,
        Identifier(DigitalTwinsMod.MOD_ID, "twin"),
        FabricEntityTypeBuilder.create(SpawnGroup.CREATURE, ::TwinEntity)
            .dimensions(EntityDimensions.fixed(0.6f, 1.95f)) // Player size
            .trackRangeChunks(10)
            .trackedUpdateRate(3)
            .build()
    )

    /**
     * Initialize entity types
     */
    fun register() {
        DigitalTwinsMod.LOGGER.info("Registering Advanced Edition entities")
    }
}

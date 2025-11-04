package com.digitaltwins.advanced.entity

import com.digitaltwins.DigitalTwinsMod
import net.minecraft.entity.EntityType
import net.minecraft.entity.SpawnGroup
import net.minecraft.entity.attribute.DefaultAttributeContainer
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
    lateinit var TWIN_ENTITY: EntityType<TwinEntity>

    /**
     * Initialize entity types
     */
    fun register() {
        DigitalTwinsMod.LOGGER.info("Registering Advanced Edition entities")
        
        // Register twin entity TYPE with default attributes
        TWIN_ENTITY = Registry.register(
            Registries.ENTITY_TYPE,
            Identifier(DigitalTwinsMod.MOD_ID, "twin"),
            EntityType.Builder.create({ entityType: EntityType<TwinEntity>, world: net.minecraft.world.World ->
                val entity = TwinEntity(entityType, world)
                DigitalTwinsMod.LOGGER.info("🏗️ TwinEntity instance created")
                entity
            }, SpawnGroup.CREATURE)
                .setDimensions(0.6f, 1.95f) // Player size
                .maxTrackingRange(10)
                .trackingTickInterval(3)
                .build("twin")
        )
        
        DigitalTwinsMod.LOGGER.info("✅ Twin entity type registered: $TWIN_ENTITY")
        
        // Try to register attributes using reflection/mixin workaround
        try {
            val attributeRegistry = Class.forName("net.minecraft.entity.attribute.DefaultAttributeRegistry")
            val putMethod = attributeRegistry.getDeclaredMethod("put", EntityType::class.java, DefaultAttributeContainer::class.java)
            putMethod.isAccessible = true
            putMethod.invoke(null, TWIN_ENTITY, TwinEntity.createAttributes().build())
            DigitalTwinsMod.LOGGER.info("✅ Twin entity attributes registered via reflection")
        } catch (e: Exception) {
            DigitalTwinsMod.LOGGER.error("❌ Failed to register attributes via reflection: ${e.message}")
            // Try Fabric API as fallback
            try {
                val fabricRegistry = Class.forName("net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry")
                val registerMethod = fabricRegistry.getDeclaredMethod("register", EntityType::class.java, DefaultAttributeContainer.Builder::class.java)
                registerMethod.invoke(null, TWIN_ENTITY, TwinEntity.createAttributes())
                DigitalTwinsMod.LOGGER.info("✅ Twin entity attributes registered via Fabric API")
            } catch (e2: Exception) {
                DigitalTwinsMod.LOGGER.error("❌ Failed to register attributes via Fabric API: ${e2.message}")
                DigitalTwinsMod.LOGGER.warn("⚠️ Entity may not work correctly without attributes!")
            }
        }
    }
}

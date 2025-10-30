package com.digitaltwins.advanced.item

import com.digitaltwins.DigitalTwinsMod
import com.digitaltwins.advanced.entity.ModEntities
import net.fabricmc.fabric.api.item.v1.FabricItemSettings
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents
import net.minecraft.item.ItemGroups
import net.minecraft.item.SpawnEggItem
import net.minecraft.registry.Registries
import net.minecraft.registry.Registry
import net.minecraft.util.Identifier

/**
 * Registers spawn eggs and other items for Advanced Edition
 */
object ModItems {

    /**
     * Generic twin spawn egg (blue/cyan theme)
     * This is a base spawn egg - we'll dynamically create eggs per twin later
     */
    val TWIN_SPAWN_EGG: SpawnEggItem = Registry.register(
        Registries.ITEM,
        Identifier(DigitalTwinsMod.MOD_ID, "twin_spawn_egg"),
        SpawnEggItem(
            ModEntities.TWIN_ENTITY,
            0x00D9FF, // Primary color (neon blue)
            0x00FFF5, // Secondary color (neon cyan)
            FabricItemSettings()
        )
    )

    /**
     * Register all items and add to creative menu
     */
    fun register() {
        DigitalTwinsMod.LOGGER.info("Registering Advanced Edition items")

        // Add spawn egg to creative menu (Tools tab)
        ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register { content ->
            content.add(TWIN_SPAWN_EGG)
        }
    }
}

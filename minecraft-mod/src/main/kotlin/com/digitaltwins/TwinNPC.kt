package com.digitaltwins

import net.minecraft.entity.EntityType
import net.minecraft.entity.decoration.ArmorStandEntity
import net.minecraft.server.world.ServerWorld
import net.minecraft.text.Text
import net.minecraft.util.math.BlockPos
import net.minecraft.util.math.Vec3d

/**
 * Manages spawned twin NPCs in the world
 */
object TwinNPC {
    private val spawnedTwins = mutableMapOf<String, ArmorStandEntity>()

    /**
     * Spawn a twin NPC in the world
     */
    fun spawn(world: ServerWorld, pos: BlockPos, twinData: TwinAPI.TwinData): ArmorStandEntity {
        // Remove existing twin if already spawned
        despawn(twinData.name)

        // Create armor stand entity
        val armorStand = ArmorStandEntity(EntityType.ARMOR_STAND, world)

        // Set position (center of block, at ground level)
        armorStand.setPosition(Vec3d(
            pos.x + 0.5,
            pos.y.toDouble(),
            pos.z + 0.5
        ))

        // Configure armor stand
        armorStand.customName = Text.literal(twinData.display_name)
        armorStand.isCustomNameVisible = true
        armorStand.isInvulnerable = true
        armorStand.setNoGravity(true)

        // Spawn in world
        world.spawnEntity(armorStand)

        // Store reference
        spawnedTwins[twinData.name] = armorStand

        return armorStand
    }

    /**
     * Despawn a twin NPC
     */
    fun despawn(name: String) {
        spawnedTwins[name]?.let { entity ->
            entity.discard()
            spawnedTwins.remove(name)
        }
    }

    /**
     * Get spawned twin by name
     */
    fun getTwin(name: String): ArmorStandEntity? {
        return spawnedTwins[name]
    }

    /**
     * Check if twin is spawned
     */
    fun isSpawned(name: String): Boolean {
        return spawnedTwins.containsKey(name) && spawnedTwins[name]?.isAlive == true
    }

    /**
     * Despawn all twins
     */
    fun despawnAll() {
        spawnedTwins.keys.toList().forEach { despawn(it) }
    }
}

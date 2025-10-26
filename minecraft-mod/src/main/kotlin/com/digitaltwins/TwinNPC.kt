package com.digitaltwins

import net.minecraft.entity.EntityType
import net.minecraft.entity.LivingEntity
import net.minecraft.entity.ai.goal.LookAtEntityGoal
import net.minecraft.entity.ai.goal.LookAroundGoal
import net.minecraft.entity.ai.goal.WanderAroundFarGoal
import net.minecraft.entity.passive.VillagerEntity
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.server.world.ServerWorld
import net.minecraft.text.Text
import net.minecraft.util.math.BlockPos
import net.minecraft.village.VillagerProfession
import net.minecraft.village.VillagerType

/**
 * Manages spawned twin NPCs in the world
 */
object TwinNPC {
    private val spawnedTwins = mutableMapOf<String, LivingEntity>()

    /**
     * Spawn a twin NPC in the world
     */
    fun spawn(world: ServerWorld, pos: BlockPos, twinData: TwinAPI.TwinData): LivingEntity {
        // Remove existing twin if already spawned
        despawn(twinData.name)

        // Create villager entity as conversational twin stand-in
        val villager = VillagerEntity(EntityType.VILLAGER, world)

        villager.refreshPositionAndAngles(
            pos.x + 0.5,
            pos.y.toDouble(),
            pos.z + 0.5,
            0f,
            0f
        )

        villager.villagerData = villager.villagerData
            .withType(VillagerType.PLAINS)
            .withProfession(VillagerProfession.NONE)

        villager.customName = Text.literal(twinData.display_name)
        villager.isCustomNameVisible = true
        villager.isInvulnerable = true
        villager.setCanPickUpLoot(false)
        villager.restrictTo(pos, 12)
        villager.setPersistent()

        // Encourage natural idle behaviour near their spawn point
        villager.goalSelector.add(4, LookAtEntityGoal(villager, PlayerEntity::class.java, 8.0f))
        villager.goalSelector.add(5, WanderAroundFarGoal(villager, 0.6))
        villager.goalSelector.add(6, LookAroundGoal(villager))

        world.spawnEntity(villager)

        spawnedTwins[twinData.name] = villager

        return villager
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
    fun getTwin(name: String): LivingEntity? {
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

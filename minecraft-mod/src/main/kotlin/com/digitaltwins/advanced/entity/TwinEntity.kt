package com.digitaltwins.advanced.entity

import com.digitaltwins.TwinStorage
import com.digitaltwins.advanced.network.PacketHandler
import net.minecraft.entity.EntityType
import net.minecraft.entity.ai.goal.*
import net.minecraft.entity.attribute.DefaultAttributeContainer
import net.minecraft.entity.attribute.EntityAttributes
import net.minecraft.entity.mob.MobEntity
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.nbt.NbtCompound
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.Text
import net.minecraft.util.ActionResult
import net.minecraft.util.Hand
import net.minecraft.world.World

/**
 * Custom entity representing a digital twin with AI behavior
 * Uses MobEntity instead of PathAwareEntity to avoid attribute registration issues
 */
class TwinEntity(entityType: EntityType<out TwinEntity>, world: World) : MobEntity(entityType, world) {

    companion object {
        /**
         * Create default attributes for twin entities
         */
        fun createAttributes(): DefaultAttributeContainer.Builder {
            println("🔧 TwinEntity.createAttributes() called")
            return createMobAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH, 20.0) // Same as player
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.25) // Slightly slower than player
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE, 48.0) // How far they can see
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 0.0) // Peaceful
        }
    }

    /**
     * The name identifier for this twin (matches TwinStorage)
     */
    var twinName: String = ""
        private set

    /**
     * The twin's display name
     */
    var twinDisplayName: String = ""
        private set

    /**
     * The twin's ID for API calls
     */
    var twinId: String = ""
        private set

    /**
     * API endpoint for this twin
     */
    var apiEndpoint: String = ""
        private set

    /**
     * Minecraft skin URL for this twin
     */
    var minecraftSkinUrl: String? = null
        private set

    init {
        // Make entity persistent (entities are persistent by default)
        println("🏗️ TwinEntity init block called")
    }

    override fun initGoals() {
        try {
            println("🎯 TwinEntity.initGoals() called")
            
            // Priority 0: Float in water
            goalSelector.add(0, SwimGoal(this))
            println("   ✓ SwimGoal added")

            // Priority 1: Look at nearby players
            goalSelector.add(1, LookAtEntityGoal(this, PlayerEntity::class.java, 8.0f))
            println("   ✓ LookAtEntityGoal added")

            // Priority 2: Look around randomly
            goalSelector.add(2, LookAroundGoal(this))
            println("   ✓ LookAroundGoal added")
            
            println("✅ All goals initialized successfully")
            println("⚠️ NOTE: Wandering disabled (MobEntity limitation - need PathAwareEntity for movement)")
        } catch (e: Exception) {
            println("❌ Error in initGoals: ${e.message}")
            e.printStackTrace()
            throw e
        }
    }

    /**
     * Set twin data from TwinStorage
     */
    fun setTwinData(name: String) {
        println("🔧 TwinEntity.setTwinData called with name: $name")
        
        val twinData = TwinStorage.getTwinByName(name)
        if (twinData == null) {
            println("❌ TwinStorage.getTwinByName returned null for: $name")
            throw IllegalStateException("Twin data not found for: $name")
        }
        
        println("✅ Twin data found: ${twinData.display_name}")

        this.twinName = twinData.name
        this.twinDisplayName = twinData.display_name
        this.twinId = twinData.twin_id
        this.apiEndpoint = twinData.api_endpoint
        this.minecraftSkinUrl = twinData.minecraft_skin_url

        println("🎨 Skin URL: ${minecraftSkinUrl ?: "null (will use Steve)"}")

        // Set custom name
        this.customName = Text.literal(twinData.display_name)
        this.isCustomNameVisible = true
        
        println("✅ TwinEntity.setTwinData completed successfully")
    }

    /**
     * Set Minecraft skin URL (overrides the one from TwinStorage)
     */
    fun setMinecraftSkin(skinUrl: String) {
        this.minecraftSkinUrl = skinUrl
        println("🎨 Applied skin URL to ${twinDisplayName}: ${skinUrl.substring(0, 50)}...")
    }

    /**
     * Handle player interaction (right-click)
     */
    override fun interactMob(player: PlayerEntity, hand: Hand): ActionResult {
        if (!world.isClient && hand == Hand.MAIN_HAND && player is ServerPlayerEntity) {
            // Open chat GUI on client via packet
            PacketHandler.sendOpenChatGUI(
                player,
                twinName,
                twinId,
                apiEndpoint
            )

            return ActionResult.SUCCESS
        }

        return ActionResult.PASS
    }

    /**
     * Save twin data to NBT
     */
    override fun writeCustomDataToNbt(nbt: NbtCompound) {
        super.writeCustomDataToNbt(nbt)
        nbt.putString("TwinName", twinName)
        nbt.putString("TwinDisplayName", twinDisplayName)
        nbt.putString("TwinId", twinId)
        nbt.putString("ApiEndpoint", apiEndpoint)
        minecraftSkinUrl?.let { nbt.putString("MinecraftSkinUrl", it) }
    }

    /**
     * Load twin data from NBT
     */
    override fun readCustomDataFromNbt(nbt: NbtCompound) {
        super.readCustomDataFromNbt(nbt)
        twinName = nbt.getString("TwinName")
        twinDisplayName = nbt.getString("TwinDisplayName")
        twinId = nbt.getString("TwinId")
        apiEndpoint = nbt.getString("ApiEndpoint")
        minecraftSkinUrl = if (nbt.contains("MinecraftSkinUrl")) nbt.getString("MinecraftSkinUrl") else null

        if (twinDisplayName.isNotEmpty()) {
            customName = Text.literal(twinDisplayName)
            isCustomNameVisible = true
        }
    }

    /**
     * Prevent despawning
     */
    override fun canImmediatelyDespawn(distanceSquared: Double): Boolean {
        return false
    }

}

package com.digitaltwins.advanced.entity

import com.digitaltwins.TwinStorage
import com.digitaltwins.advanced.network.PacketHandler
import net.minecraft.entity.EntityType
import net.minecraft.entity.ai.goal.*
import net.minecraft.entity.mob.PathAwareEntity
import net.minecraft.entity.player.PlayerEntity
import net.minecraft.nbt.NbtCompound
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.text.Text
import net.minecraft.util.ActionResult
import net.minecraft.util.Hand
import net.minecraft.world.World

/**
 * Custom entity representing a digital twin with AI behavior
 */
class TwinEntity(entityType: EntityType<out TwinEntity>, world: World) : PathAwareEntity(entityType, world) {

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
    }

    override fun initGoals() {
        // Priority 0: Float in water
        goalSelector.add(0, SwimGoal(this))

        // Priority 1: Panic when hurt
        goalSelector.add(1, EscapeDangerGoal(this, 1.25))

        // Priority 2: Look at nearby players
        goalSelector.add(2, LookAtEntityGoal(this, PlayerEntity::class.java, 8.0f))

        // Priority 3: Look around randomly
        goalSelector.add(3, LookAroundGoal(this))

        // Priority 4: Wander around
        goalSelector.add(4, WanderAroundFarGoal(this, 1.0))
    }

    /**
     * Set twin data from TwinStorage
     */
    fun setTwinData(name: String) {
        val twinData = TwinStorage.getTwinByName(name) ?: return

        this.twinName = twinData.name
        this.twinDisplayName = twinData.display_name
        this.twinId = twinData.twin_id
        this.apiEndpoint = twinData.api_endpoint
        this.minecraftSkinUrl = twinData.minecraft_skin_url

        // Set custom name
        this.customName = Text.literal(twinData.display_name)
        this.isCustomNameVisible = true
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

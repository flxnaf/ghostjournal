package com.digitaltwins.advanced.network

import com.digitaltwins.DigitalTwinsMod
import com.digitaltwins.advanced.client.TwinChatScreen
import com.digitaltwins.TwinAudioPlayer
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking
import net.fabricmc.fabric.api.networking.v1.PacketByteBufs
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking
import net.minecraft.server.network.ServerPlayerEntity
import net.minecraft.util.Identifier

/**
 * Handles network communication between client and server
 * for Advanced Edition features
 */
object PacketHandler {

    /**
     * Packet ID for opening twin chat GUI
     */
    val OPEN_CHAT_GUI_PACKET = Identifier(DigitalTwinsMod.MOD_ID, "open_chat_gui")

    /**
     * Packet ID for triggering client-side audio playback
     */
    val PLAY_AUDIO_PACKET = Identifier(DigitalTwinsMod.MOD_ID, "play_audio")

    /**
     * Register server-side packet senders
     */
    fun registerServer() {
        DigitalTwinsMod.LOGGER.info("Registering Advanced Edition server packets")
    }

    /**
     * Register client-side packet receivers
     */
    fun registerClient() {
        DigitalTwinsMod.LOGGER.info("Registering Advanced Edition client packets")

        // Register handler for opening chat GUI
        ClientPlayNetworking.registerGlobalReceiver(OPEN_CHAT_GUI_PACKET) { client, _, buf, _ ->
            val twinName = buf.readString()
            val twinId = buf.readString()
            val apiEndpoint = buf.readString()

            // Open GUI on client thread
            client.execute {
                client.setScreen(TwinChatScreen(twinName, twinId, apiEndpoint))
            }
        }

        // Register handler for audio playback
        ClientPlayNetworking.registerGlobalReceiver(PLAY_AUDIO_PACKET) { client, _, buf, _ ->
            val audioUrl = buf.readString()

            client.execute {
                TwinAudioPlayer.enqueue(audioUrl)
            }
        }
    }

    /**
     * Send packet to client to open twin chat GUI
     */
    fun sendOpenChatGUI(
        player: ServerPlayerEntity,
        twinName: String,
        twinId: String,
        apiEndpoint: String
    ) {
        val buf = PacketByteBufs.create()
        buf.writeString(twinName)
        buf.writeString(twinId)
        buf.writeString(apiEndpoint)

        ServerPlayNetworking.send(player, OPEN_CHAT_GUI_PACKET, buf)
    }

    /**
     * Send packet to client to play audio response
     */
    fun sendPlayAudio(player: ServerPlayerEntity, audioUrl: String) {
        val buf = PacketByteBufs.create()
        buf.writeString(audioUrl)

        ServerPlayNetworking.send(player, PLAY_AUDIO_PACKET, buf)
    }
}

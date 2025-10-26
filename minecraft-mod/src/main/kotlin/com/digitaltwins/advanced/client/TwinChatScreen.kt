package com.digitaltwins.advanced.client

import com.digitaltwins.TwinAPI
import com.digitaltwins.TwinAudioPlayer
import com.digitaltwins.TwinStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import net.minecraft.client.gui.DrawContext
import net.minecraft.client.gui.screen.Screen
import net.minecraft.client.gui.widget.ButtonWidget
import net.minecraft.client.gui.widget.TextFieldWidget
import net.minecraft.text.Text

/**
 * Custom GUI screen for chatting with digital twins
 * Opens when right-clicking a TwinEntity
 */
class TwinChatScreen(
    private val twinName: String,
    private val twinId: String,
    private val apiEndpoint: String
) : Screen(Text.literal("Chat with Twin")) {

    private lateinit var inputField: TextFieldWidget
    private lateinit var sendButton: ButtonWidget
    private val chatHistory = mutableListOf<String>()
    private var isWaitingForResponse = false

    override fun init() {
        super.init()

        val twinData = TwinStorage.getTwinByName(twinName)
        val displayName = twinData?.display_name ?: twinName

        // Input field at bottom
        inputField = TextFieldWidget(
            textRenderer,
            width / 2 - 150,
            height - 40,
            300,
            20,
            Text.literal("Type message...")
        )
        inputField.setMaxLength(256)
        inputField.setPlaceholder(Text.literal("Type your message..."))
        addSelectableChild(inputField)

        // Send button
        sendButton = ButtonWidget.builder(Text.literal("Send")) { sendMessage() }
            .dimensions(width / 2 + 160, height - 40, 60, 20)
            .build()
        addDrawableChild(sendButton)

        // Close button
        addDrawableChild(
            ButtonWidget.builder(Text.literal("Close")) { close() }
                .dimensions(width / 2 + 225, height - 40, 60, 20)
                .build()
        )

        // Add welcome message
        chatHistory.add("§b=== Chat with $displayName ===")
        chatHistory.add("§7Type a message and press Enter or click Send")
    }

    override fun render(context: DrawContext, mouseX: Int, mouseY: Int, delta: Float) {
        // Dark background
        renderBackground(context)

        // Title
        val twinData = TwinStorage.getTwinByName(twinName)
        val displayName = twinData?.display_name ?: twinName
        context.drawCenteredTextWithShadow(
            textRenderer,
            "§bChat with $displayName",
            width / 2,
            20,
            0xFFFFFF
        )

        // Chat history (show last 15 messages)
        var y = 50
        val visibleMessages = chatHistory.takeLast(15)
        for (message in visibleMessages) {
            context.drawTextWithShadow(
                textRenderer,
                message,
                20,
                y,
                0xFFFFFF
            )
            y += 12
        }

        // Render input field
        inputField.render(context, mouseX, mouseY, delta)

        // Render buttons
        super.render(context, mouseX, mouseY, delta)
    }

    override fun keyPressed(keyCode: Int, scanCode: Int, modifiers: Int): Boolean {
        // Send on Enter key (keyCode 257)
        if (keyCode == 257 && !isWaitingForResponse) {
            sendMessage()
            return true
        }

        // Let input field handle other keys
        if (inputField.keyPressed(keyCode, scanCode, modifiers)) {
            return true
        }

        return super.keyPressed(keyCode, scanCode, modifiers)
    }

    override fun mouseClicked(mouseX: Double, mouseY: Double, button: Int): Boolean {
        // Focus input field on click
        inputField.mouseClicked(mouseX, mouseY, button)
        return super.mouseClicked(mouseX, mouseY, button)
    }

    private fun sendMessage() {
        val message = inputField.text.trim()
        if (message.isEmpty() || isWaitingForResponse) return

        // Add to chat history
        chatHistory.add("§a[You]§f $message")
        inputField.text = ""
        isWaitingForResponse = true

        // Show loading message
        chatHistory.add("§e$twinName is thinking...")

        // Send to API async
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = TwinAPI.sendMessage(
                    apiEndpoint,
                    twinId,
                    message
                )

                // Add response to chat history (on main thread)
                client?.execute {
                    // Remove "thinking..." message
                    chatHistory.removeLastOrNull()

                    // Add response
                    val twinData = TwinStorage.getTwinByName(twinName)
                    val displayName = twinData?.display_name ?: twinName
                    chatHistory.add("§b[$displayName]§f ${response.text}")

                    // Play voice audio if available
                    if (!response.audioUrl.isNullOrEmpty()) {
                        val fullAudioUrl = if (response.audioUrl.startsWith("http")) {
                            response.audioUrl
                        } else {
                            val baseUrl = apiEndpoint.replace("/api/speak", "")
                            "$baseUrl${response.audioUrl}"
                        }

                        chatHistory.add("§a🔊 Playing voice...")
                        TwinAudioPlayer.enqueue(fullAudioUrl)
                    }

                    isWaitingForResponse = false
                }
            } catch (e: Exception) {
                client?.execute {
                    chatHistory.removeLastOrNull()
                    chatHistory.add("§c✗ Failed to get response: ${e.message}")
                    chatHistory.add("§7Check your internet connection")
                    isWaitingForResponse = false
                }
            }
        }
    }

    override fun shouldPause(): Boolean {
        // Don't pause the game
        return false
    }
}

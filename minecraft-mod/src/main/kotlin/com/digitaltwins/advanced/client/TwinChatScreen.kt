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
    
    companion object {
        // Store chat history per twin to persist across screen opens
        private val chatHistories = mutableMapOf<String, MutableList<String>>()
    }
    
    /**
     * Wrap text to fit within screen width, handling Minecraft color codes
     */
    private fun wrapText(text: String, maxWidth: Int): List<String> {
        // Extract color code prefix (e.g., "§b[Felix]§f ")
        val colorCodeRegex = Regex("(§[0-9a-fklmnor])+")
        var currentColorCodes = ""
        
        val words = text.split(" ")
        val lines = mutableListOf<String>()
        var currentLine = ""
        
        for (word in words) {
            // Track color codes in this word
            if (word.contains("§")) {
                colorCodeRegex.findAll(word).forEach { match ->
                    currentColorCodes = match.value
                }
            }
            
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            // Strip color codes for width measurement
            val visibleText = testLine.replace(colorCodeRegex, "")
            val width = textRenderer.getWidth(visibleText)
            
            if (width > maxWidth) {
                if (currentLine.isNotEmpty()) {
                    lines.add(currentLine)
                    // Start new line with inherited color codes
                    currentLine = currentColorCodes + word.replace(colorCodeRegex, "")
                } else {
                    // Single word too long, just add it
                    lines.add(word)
                }
            } else {
                currentLine = testLine
            }
        }
        
        if (currentLine.isNotEmpty()) {
            lines.add(currentLine)
        }
        
        return lines
    }

    override fun init() {
        super.init()

        val twinData = TwinStorage.getTwinByName(twinName)
        val displayName = twinData?.display_name ?: twinName
        
        println("🎭 TwinChatScreen.init()")
        println("   twinName: $twinName")
        println("   twinId: $twinId")
        println("   displayName: $displayName")
        println("   apiEndpoint: $apiEndpoint")

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

        // Restore previous chat history or create new
        val persistedHistory = chatHistories[twinName]
        if (persistedHistory != null) {
            chatHistory.addAll(persistedHistory)
            println("✅ Restored ${persistedHistory.size} messages from history")
        } else {
            // Add welcome message only for new conversations
            chatHistory.add("§b=== Chat with $displayName ===")
            chatHistory.add("§7Type a message and press Enter or click Send")
            chatHistories[twinName] = chatHistory
        }
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

        // Chat history with text wrapping
        var y = 50
        val maxWidth = width - 40 // 20px padding on each side
        val maxHeight = height - 80 // Leave room for input
        
        // Wrap all messages and calculate total lines
        val wrappedMessages = mutableListOf<String>()
        for (message in chatHistory) {
            // Wrap each message to fit screen width
            val textWidth = textRenderer.getWidth(message.replace(Regex("§[0-9a-fklmnor]"), ""))
            
            if (textWidth > maxWidth) {
                // Message is too long, wrap it
                val words = message.split(" ")
                var currentLine = ""
                var currentColor = ""
                
                for (word in words) {
                    // Track color codes
                    Regex("(§[0-9a-fklmnor])").findAll(word).forEach { match ->
                        currentColor = match.value
                    }
                    
                    val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
                    val visibleWidth = textRenderer.getWidth(testLine.replace(Regex("§[0-9a-fklmnor]"), ""))
                    
                    if (visibleWidth > maxWidth && currentLine.isNotEmpty()) {
                        wrappedMessages.add(currentLine)
                        currentLine = currentColor + word.replace(Regex("§[0-9a-fklmnor]"), "")
                    } else {
                        currentLine = testLine
                    }
                }
                
                if (currentLine.isNotEmpty()) {
                    wrappedMessages.add(currentLine)
                }
            } else {
                // Message fits, add as-is
                wrappedMessages.add(message)
            }
        }
        
        // Show only lines that fit on screen (from bottom up)
        val linesPerScreen = maxOf(1, (maxHeight - 50) / 12)
        val visibleLines = wrappedMessages.takeLast(linesPerScreen)
        
        for (line in visibleLines) {
            context.drawTextWithShadow(
                textRenderer,
                line,
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

        println("═══════════════════════════════════════════")
        println("📤 SENDING MESSAGE TO API")
        println("═══════════════════════════════════════════")
        println("   Message: $message")
        println("   API Endpoint: $apiEndpoint")
        println("   Twin ID: $twinId")
        println("   Twin Name: $twinName")

        // Add to chat history
        chatHistory.add("§a[You]§f $message")
        inputField.text = ""
        isWaitingForResponse = true

        // Show loading message
        chatHistory.add("§e$twinName is thinking...")

        // Send to API async
        CoroutineScope(Dispatchers.IO).launch {
            try {
                println("📡 Calling TwinAPI.sendMessage...")
                val response = TwinAPI.sendMessage(
                    apiEndpoint,
                    twinId,
                    message
                )
                
                println("✅ Got API response!")
                println("   Response text: ${response.text.substring(0, minOf(100, response.text.length))}...")
                println("   Audio URL: ${response.audioUrl ?: "NULL"}")

                // Add response to chat history (on main thread)
                client?.execute {
                    // Remove "thinking..." message
                    chatHistory.removeLastOrNull()

                    // Add response
                    val twinData = TwinStorage.getTwinByName(twinName)
                    val displayName = twinData?.display_name ?: twinName
                    chatHistory.add("§b[$displayName]§f ${response.text}")
                    
                    println("🔊 Fish Audio Debug:")
                    println("   response.audioUrl: ${response.audioUrl}")
                    println("   isEmpty: ${response.audioUrl.isNullOrEmpty()}")

                    // Play voice audio if available
                    if (!response.audioUrl.isNullOrEmpty()) {
                        val fullAudioUrl = if (response.audioUrl.startsWith("http")) {
                            response.audioUrl
                        } else {
                            val baseUrl = apiEndpoint.replace("/api/speak", "")
                            "$baseUrl${response.audioUrl}"
                        }
                        
                        println("   fullAudioUrl: $fullAudioUrl")
                        chatHistory.add("§a♪ Playing voice...")
                        
                        try {
                            TwinAudioPlayer.playAudioFromUrl(fullAudioUrl)
                            println("   ✅ Audio playback started")
                        } catch (e: Exception) {
                            println("   ❌ Audio playback failed: ${e.message}")
                            chatHistory.add("§c✗ Audio playback failed")
                        }
                    } else {
                        println("   ⚠️ No audio URL provided")
                        chatHistory.add("§7(No voice audio)")
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

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, MessageCircle, Download } from 'lucide-react'
import ContextBuilder from './ContextBuilder'
import CloneChat from './CloneChat'
import axios from 'axios'

interface CloneTabsProps {
  userId: string
  currentUserId?: string // The logged-in user's ID
  isOwner?: boolean // Whether the current user owns this clone
  ownerName?: string | null // The name of the clone owner (for browsing other clones)
  username?: string // The username of the clone owner
}

export default function CloneTabs({ userId, currentUserId, isOwner = true, ownerName, username }: CloneTabsProps) {
  // If viewing someone else's clone, default to chat tab
  const [activeTab, setActiveTab] = useState<'context' | 'chat'>(isOwner ? 'context' : 'chat')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadClone = async () => {
    setIsDownloading(true)
    try {
      const response = await axios.get(`/api/personality?userId=${userId}`)
      const userData = response.data
      
      // Fetch memories/context
      const memoriesResponse = await axios.get(`/api/memory?userId=${userId}`)
      const memories = memoriesResponse.data.memories || []
      
      const jsonData = {
        userId,
        exportDate: new Date().toISOString(),
        
        context: {
          entries: memories.map((m: any) => ({
            category: m.category,
            content: m.content,
            timestamp: m.createdAt
          })),
          totalEntries: memories.length,
          categories: [...new Set(memories.map((m: any) => m.category))]
        },
        
        audioData: {
          audioUrl: userData.audioUrl || null,
          voiceModelId: userData.voiceModelId || null,
          voiceModelProvider: 'fish-audio',
          usage: {
            description: "Use voiceModelId to make Fish Audio API calls for voice synthesis",
            apiEndpoint: "https://api.fish.audio/v1/tts",
            requiredFields: ["text", "reference_id (voiceModelId)", "format"],
            note: "The actual voice model is hosted by Fish Audio and accessed via API. You cannot download the model itself."
          }
        },
        
        faceData: userData.faceData ? JSON.parse(userData.faceData) : null,
        
        metadata: {
          name: userData.name || 'Unknown',
          username: username || userData.username || 'unknown',
          email: userData.email || null,
          createdAt: userData.createdAt || new Date().toISOString(),
          minecraftIntegration: {
            howToUse: "See MINECRAFT_INTEGRATION.md in the Replik repo",
            apiUrl: window.location.origin + "/api/speak",
            requiresInternet: true
          }
        }
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const downloadUsername = username || userData.username || 'clone'
      a.download = `${downloadUsername}_clone.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('✅ Clone downloaded successfully')
    } catch (error) {
      console.error('❌ Download failed:', error)
      alert('Failed to download clone data. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tab Headers with Download Button */}
      <div className="flex items-center justify-between mb-8 border-b border-white/20">
        <div className="flex gap-4 flex-1 justify-center">
          {/* Only show Context Builder tab if user owns this clone */}
          {isOwner && (
            <button
              onClick={() => setActiveTab('context')}
              className={`px-8 py-4 font-bold text-lg transition-all relative ${
                activeTab === 'context'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Edit3 className="w-5 h-5 inline-block mr-2" />
              Build Context
              {activeTab === 'context' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-8 py-4 font-bold text-lg transition-all relative ${
              activeTab === 'chat'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            >
              <MessageCircle className="w-5 h-5 inline-block mr-2" />
              {ownerName ? `Chat with ${ownerName}'s Clone` : 'Chat with Clone'}
              {activeTab === 'chat' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-white"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Download Button (visible for both owner and browser) */}
        <button
          onClick={handleDownloadClone}
          disabled={isDownloading}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                     font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download JSON'}
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'context' && isOwner ? (
          <ContextBuilder userId={userId} username={username} />
        ) : (
          <CloneChat userId={userId} ownerName={ownerName} />
        )}
      </motion.div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Download, Heart, BookOpen, RotateCcw, Smile, Target, Brain, Trophy, Star } from 'lucide-react'

interface ContextBuilderProps {
  userId: string
}

interface ContextEntry {
  id: string
  category: string
  content: string
  timestamp: Date
}

export default function ContextBuilder({ userId }: ContextBuilderProps) {
  const [entries, setEntries] = useState<ContextEntry[]>([])
  const [newEntry, setNewEntry] = useState({ category: 'story', content: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Check if user is admin
  const isAdminUser = userId === '00000000-0000-0000-0000-000000000001'
  const STORAGE_KEY = `context_entries_${userId}`

  // Load existing context from database or localStorage
  useEffect(() => {
    loadContext()
  }, [userId])

  const loadContext = async () => {
    console.log('═══════════════════════════════════════════════')
    console.log('🔍 ContextBuilder.loadContext() called')
    console.log('   userId:', userId)
    console.log('   isAdminUser:', isAdminUser)
    console.log('   STORAGE_KEY:', STORAGE_KEY)
    console.log('═══════════════════════════════════════════════')
    
    try {
      // For admin users, try localStorage first
      if (isAdminUser) {
        console.log('🔑 Admin user detected - checking localStorage...')
        const cached = localStorage.getItem(STORAGE_KEY)
        console.log('   localStorage value:', cached ? `${cached.length} chars` : 'NULL')
        
        if (cached) {
          console.log('📦 Loading context from localStorage (admin mode)')
          const parsed = JSON.parse(cached)
          console.log('   Parsed entries:', parsed.length)
          setEntries(parsed)
          setLoading(false)
          return
        }
        
        console.log('   No localStorage data, will try database...')
      } else {
        console.log('👤 Regular user - skipping localStorage, going to database')
      }
      
      console.log('📥 Calling GET /api/memory...')
      console.log('   URL:', `/api/memory?userId=${userId}`)
      
      // Load memories from database (initial contexts + user-added ones)
      const memoriesResponse = await axios.get(`/api/memory?userId=${userId}`)
      
      console.log('📦 API Response received:')
      console.log('   Status:', memoriesResponse.status)
      console.log('   Data:', memoriesResponse.data)
      
      const memories = memoriesResponse.data.memories || []
      
      console.log(`✅ Loaded ${memories.length} memories from database`)
      
      if (memories.length > 0) {
        console.log('   Sample memory:', memories[0])
        console.log('   Categories:', memories.map((m: any) => m.category).join(', '))
      } else {
        console.log('   ⚠️ NO MEMORIES RETURNED FROM DATABASE!')
      }
      
      // Convert memories to ContextEntry format
      const contextEntries: ContextEntry[] = memories.map((mem: any) => ({
        id: mem.id,
        category: mem.category || 'story',
        content: mem.content,
        timestamp: new Date(mem.createdAt)
      }))
      
      console.log('📝 Converted to ContextEntry format:', contextEntries.length)
      
      setEntries(contextEntries)
      
      // Also cache to localStorage for offline access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contextEntries))
      console.log('💾 Cached to localStorage for offline access')
      
    } catch (error: any) {
      console.error('Error loading context:', error)
      console.error('   Error details:', error.response?.data || error.message)
      
      // Fallback to localStorage for any user
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        console.log('📦 Loading context from localStorage (fallback)')
        setEntries(JSON.parse(cached))
      }
    } finally {
      setLoading(false)
    }
  }

  const addEntry = async () => {
    if (!newEntry.content.trim()) {
      alert('Please enter some content')
      return
    }

    setSaving(true)
    try {
      console.log('💾 Saving new entry:', newEntry.category)
      
      // Save to database first (creates Memory record)
      if (!isAdminUser) {
        const response = await axios.post('/api/memory', {
          userId,
          content: newEntry.content,
          category: newEntry.category,
          action: 'add'
        })
        
        console.log('✅ Memory saved to database:', response.data)
        
        // IMMEDIATELY regenerate personality with new entry
        console.log('🔄 Regenerating personality with new entry...')
        await axios.post('/api/personality', {
          userId
        })
        console.log('✅ Personality regenerated!')
        
        // Reload all memories to stay in sync with database
        await loadContext()
      } else {
        // Admin mode: save to localStorage only
        console.log('🔑 Admin mode - saving to localStorage only')
        const entry: ContextEntry = {
          id: `entry_${Date.now()}`,
          category: newEntry.category,
          content: newEntry.content,
          timestamp: new Date()
        }
        const updatedEntries = [...entries, entry]
        setEntries(updatedEntries)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
      }

      // Clear form
      setNewEntry({ category: 'story', content: '' })
    } catch (error: any) {
      console.error('❌ Error saving entry:', error)
      console.error('   Error response:', error.response?.data)
      const errorMsg = error.response?.data?.details || error.message || 'Unknown error'
      alert(`Failed to save entry: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    console.log('🗑️ Deleting entry:', id)
    
    // Delete from database first
    if (!isAdminUser) {
      try {
        await axios.delete(`/api/memory?userId=${userId}&memoryId=${id}`)
        console.log('✅ Memory deleted from database')
        
        // IMMEDIATELY regenerate personality without this entry
        console.log('🔄 Regenerating personality after deletion...')
        await axios.post('/api/personality', {
          userId
        })
        console.log('✅ Personality regenerated!')
        
        // Reload all memories to stay in sync with database
        await loadContext()
      } catch (error) {
        console.error('❌ Error deleting entry:', error)
        alert('Failed to delete entry. Please try again.')
        return
      }
    } else {
      // Admin mode: delete from localStorage only
      console.log('🔑 Admin mode - deleting from localStorage only')
      const updatedEntries = entries.filter(e => e.id !== id)
      setEntries(updatedEntries)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
    }
  }

  const downloadJSON = async () => {
    // Fetch additional user data (audio, voice model, face data)
    let userData: any = {}
    try {
      const response = await axios.get(`/api/personality?userId=${userId}`)
      userData = response.data
    } catch (error) {
      console.log('Could not fetch additional user data, exporting context only')
    }

    const jsonData = {
      userId,
      exportDate: new Date().toISOString(),
      
      // Context entries (stories, habits, etc.) - use current state, not API
      context: {
        entries: entries.map(e => ({
          category: e.category,
          content: e.content,
          timestamp: e.timestamp
        })),
        totalEntries: entries.length,
        categories: [...new Set(entries.map(e => e.category))]
      },
      
      // Audio training data (for Minecraft mod)
      audioData: {
        audioUrl: userData.audioUrl || null,
        voiceModelId: userData.voiceModelId || null,
        voiceModelProvider: 'fish-audio',
        
        // IMPORTANT: Instructions for Minecraft integration
        usage: {
          description: "Use voiceModelId to make Fish Audio API calls for voice synthesis",
          apiEndpoint: "https://api.fish.audio/v1/tts",
          requiredFields: ["text", "reference_id (voiceModelId)", "format"],
          note: "The actual voice model is hosted by Fish Audio and accessed via API. You cannot download the model itself."
        }
      },
      
      // Face/appearance data
      faceData: userData.faceData ? JSON.parse(userData.faceData) : null,
      
      // User metadata
      metadata: {
        name: userData.name || 'Unknown',
        email: userData.email || null,
        createdAt: userData.createdAt || new Date().toISOString(),
        
        // Add info for Minecraft integration
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
    a.download = `clone-data-${userId}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Download Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Build Your Clone Model</h2>
          <p className="text-gray-400">
            Add stories, habits, and personality traits to train your digital clone
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadJSON}
          disabled={entries.length === 0}
          className="px-6 py-3 bg-transparent border-2 border-white text-white font-bold rounded-lg
                   hover:bg-white hover:text-black transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export JSON
        </motion.button>
      </div>

      {/* Add New Entry Form */}
      <div className="bg-dark-surface rounded-lg p-6 glow-border">
        <h3 className="text-xl font-bold text-white mb-4">Add New Entry</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Category</label>
            <select
              value={newEntry.category}
              onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
              className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white focus:border-white focus:outline-none"
            >
              <option value="story">Story</option>
              <option value="habit">Daily Habit</option>
              <option value="reaction">Typical Reaction</option>
              <option value="preference">Preference</option>
              <option value="skill">Skill</option>
              <option value="memory">Memory</option>
              <option value="goal">Goal</option>
              <option value="value">Core Value</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Content</label>
            <textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={4}
              className="w-full bg-dark-bg border border-white/30 rounded-lg p-3 
                       text-white focus:border-white focus:outline-none"
              placeholder="Enter details about yourself..."
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addEntry}
            disabled={saving}
            className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg
                     hover:bg-gray-200 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : '+ Add Entry'}
          </motion.button>
        </div>
      </div>

      {/* Existing Entries */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">
          Your Context ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
        </h3>

        {entries.length === 0 ? (
          <div className="bg-dark-surface rounded-lg p-12 text-center glow-border">
            <p className="text-gray-400 text-lg mb-2">No context entries yet</p>
            <p className="text-gray-500 text-sm">Add your first entry above to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-dark-surface rounded-lg p-6 border border-white/20
                         hover:border-white/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-dark-bg rounded-full text-sm font-medium text-white flex items-center gap-2">
                      {entry.category === 'story' && <BookOpen className="w-4 h-4" />}
                      {entry.category === 'habit' && <RotateCcw className="w-4 h-4" />}
                      {entry.category === 'reaction' && <Smile className="w-4 h-4" />}
                      {entry.category === 'preference' && <Heart className="w-4 h-4" />}
                      {entry.category === 'skill' && <Target className="w-4 h-4" />}
                      {entry.category === 'memory' && <Brain className="w-4 h-4" />}
                      {entry.category === 'goal' && <Trophy className="w-4 h-4" />}
                      {entry.category === 'value' && <Star className="w-4 h-4" />}
                      {entry.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-white leading-relaxed">{entry.content}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-dark-bg border border-white/20 rounded-lg p-4">
        <p className="text-sm text-gray-300">
          <strong className="text-white">💡 Tip:</strong> The more context you add, the more accurate your clone model will be. 
          Export includes audio training data, voice model ID, face data, and all personality context for Minecraft integration.
        </p>
      </div>
    </div>
  )
}


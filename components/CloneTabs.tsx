'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, MessageCircle } from 'lucide-react'
import ContextBuilder from './ContextBuilder'
import CloneChat from './CloneChat'

interface CloneTabsProps {
  userId: string
  currentUserId?: string // The logged-in user's ID
  isOwner?: boolean // Whether the current user owns this clone
  ownerName?: string | null // The name of the clone owner (for browsing other clones)
}

export default function CloneTabs({ userId, currentUserId, isOwner = true, ownerName }: CloneTabsProps) {
  // If viewing someone else's clone, default to chat tab
  const [activeTab, setActiveTab] = useState<'context' | 'chat'>(isOwner ? 'context' : 'chat')

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tab Headers */}
      <div className="flex gap-4 mb-8 border-b border-white/20 justify-center">
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
            Chat with Clone
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

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'context' && isOwner ? (
          <ContextBuilder userId={userId} />
        ) : (
          <CloneChat userId={userId} ownerName={ownerName} />
        )}
      </motion.div>
    </div>
  )
}


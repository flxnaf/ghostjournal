'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, Users, Trash2, Globe, Lock } from 'lucide-react'

interface DashboardProps {
  user: any
  onCreateCharacter: () => void
  onBrowseClones: () => void
  onLogout: () => void
  onReRecordVoice?: () => void
}

export default function Dashboard({ user, onCreateCharacter, onBrowseClones, onLogout, onReRecordVoice }: DashboardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublic, setIsPublic] = useState(user.isPublic || false)
  const [isTogglingPublic, setIsTogglingPublic] = useState(false)

  // Sync local state with user prop changes
  useEffect(() => {
    console.log('🔄 Dashboard: Syncing isPublic state with user prop:', user.isPublic)
    setIsPublic(user.isPublic || false)
  }, [user.isPublic])

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await axios.delete('/api/delete-account')
      alert('Account deleted successfully')
      onLogout()
    } catch (error) {
      console.error('Delete account error:', error)
      alert('Failed to delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true)
    try {
      const newStatus = !isPublic
      await axios.post('/api/toggle-public', { 
        userId: user.id, 
        isPublic: newStatus 
      })
      setIsPublic(newStatus)
    } catch (error) {
      console.error('Toggle public error:', error)
      alert('Failed to update visibility. Please try again.')
    } finally {
      setIsTogglingPublic(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 glow-text">
            Welcome back, {user.name || user.username}!
          </h1>
          <p className="text-xl text-gray-400">
            What would you like to do?
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create/Edit Character */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-surface rounded-2xl p-8 glow-border
                     hover:border-white/50 transition-all"
          >
            <div className="mb-4">
              <User className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              My Clone Model
            </h2>
            <p className="text-gray-400 mb-4">
              Create or edit your digital clone. Train your voice, upload your appearance, and build your personality model.
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={onCreateCharacter}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg
                         font-medium transition-all flex items-center justify-center"
              >
                <span>Edit Character</span>
                <span className="ml-2">→</span>
              </button>
              
              {onReRecordVoice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onReRecordVoice()
                  }}
                  className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 
                           text-blue-400 border border-blue-400/30 rounded-lg
                           font-medium transition-all"
                >
                  Re-record Voice
                </button>
              )}
            </div>
          </motion.div>

          {/* Browse Clones */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            onClick={onBrowseClones}
            className="bg-dark-surface rounded-2xl p-8 glow-border cursor-pointer
                     hover:border-white/50 transition-all"
          >
            <div className="mb-4">
              <Users className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Browse Clone Models
            </h2>
            <p className="text-gray-400 mb-4">
              Discover and interact with other people's digital clones. Search by username or explore featured models.
            </p>
            <div className="flex items-center text-white font-medium">
              <span>Explore</span>
              <span className="ml-2">→</span>
            </div>
          </motion.div>
        </div>

        {/* Public/Private Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-2xl mx-auto bg-dark-surface rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Globe className="w-5 h-5" />
                    Public Clone
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Private Clone
                  </>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {isPublic 
                  ? 'Your clone is searchable. Others can find and chat with it.'
                  : 'Your clone is private. Only you can access it.'}
              </p>
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={isTogglingPublic}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isPublic
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTogglingPublic ? 'Updating...' : (isPublic ? 'Make Private' : 'Make Public')}
            </button>
          </div>
        </motion.div>

        {/* Delete Account Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 text-sm text-red-400 border border-red-400/30 rounded-lg
                     hover:bg-red-400/10 transition-colors"
          >
            Delete Account
          </button>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-dark-card border border-red-500/50 rounded-2xl p-8 max-w-md mx-4"
            >
              <h3 className="text-2xl font-bold text-red-400 mb-4">
                Delete Account?
              </h3>
              <p className="text-gray-400 mb-6">
                This will permanently delete your account, voice model, photos, chat history, and all associated data. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-transparent border border-white/30 text-white rounded-lg
                           hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg
                           hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}


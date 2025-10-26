'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'

interface DashboardProps {
  user: any
  onCreateCharacter: () => void
  onBrowseClones: () => void
  onLogout: () => void
}

export default function Dashboard({ user, onCreateCharacter, onBrowseClones, onLogout }: DashboardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
            whileHover={{ scale: 1.02 }}
            onClick={onCreateCharacter}
            className="bg-dark-surface rounded-2xl p-8 glow-border cursor-pointer
                     hover:border-white/50 transition-all"
          >
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              My Clone Model
            </h2>
            <p className="text-gray-400 mb-4">
              Create or edit your digital clone. Train your voice, upload your appearance, and build your personality model.
            </p>
            <div className="flex items-center text-white font-medium">
              <span>Get Started</span>
              <span className="ml-2">→</span>
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
            <div className="text-6xl mb-4">🔍</div>
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

        {/* Delete Account Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
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


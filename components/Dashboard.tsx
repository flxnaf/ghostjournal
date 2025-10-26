'use client'

import { motion } from 'framer-motion'

interface DashboardProps {
  user: any
  onCreateCharacter: () => void
  onBrowseClones: () => void
}

export default function Dashboard({ user, onCreateCharacter, onBrowseClones }: DashboardProps) {
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
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageCircle, BookOpen, Camera } from 'lucide-react'

interface ConsentDialogProps {
  isOpen: boolean
  onAccept: (consent: {
    audio: boolean
    chat: boolean
    context: boolean
    faceData: boolean
  }) => void
  onDecline: () => void
}

export default function ConsentDialog({ isOpen, onAccept, onDecline }: ConsentDialogProps) {
  const [consentAudio, setConsentAudio] = useState(true)
  const [consentChat, setConsentChat] = useState(true)
  const [consentContext, setConsentContext] = useState(true)
  const [consentFaceData, setConsentFaceData] = useState(true)

  const handleAccept = () => {
    onAccept({
      audio: consentAudio,
      chat: consentChat,
      context: consentContext,
      faceData: consentFaceData
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-dark-card border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              📊 Data Privacy & Consent
            </h2>
            
            <p className="text-gray-300 mb-6">
              To create your AI clone, we need to save your data. You control what we store:
            </p>

            <div className="space-y-4 mb-8">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentAudio}
                  onChange={(e) => setConsentAudio(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white/50"
                />
                <div>
                  <div className="text-white font-medium group-hover:text-white/80 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Audio recordings
                  </div>
                  <div className="text-sm text-gray-400">
                    Save your voice for cloning
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChat}
                  onChange={(e) => setConsentChat(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white/50"
                />
                <div>
                  <div className="text-white font-medium group-hover:text-white/80 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat history
                  </div>
                  <div className="text-sm text-gray-400">
                    Save conversations for context
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentContext}
                  onChange={(e) => setConsentContext(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white/50"
                />
                <div>
                  <div className="text-white font-medium group-hover:text-white/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Personal stories & context
                  </div>
                  <div className="text-sm text-gray-400">
                    Save your stories, habits, and reactions
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentFaceData}
                  onChange={(e) => setConsentFaceData(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-transparent checked:bg-white checked:border-white focus:ring-2 focus:ring-white/50"
                />
                <div>
                  <div className="text-white font-medium group-hover:text-white/80 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos & 3D face model
                  </div>
                  <div className="text-sm text-gray-400">
                    Save your photos and generated face
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
              >
                Accept & Continue
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              You can change these preferences anytime in settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


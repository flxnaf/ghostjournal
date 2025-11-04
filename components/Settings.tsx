import { useState } from 'react'
import { Settings as SettingsIcon, X, Check, AlertCircle, Trash2 } from 'lucide-react'
import axios from 'axios'

interface SettingsProps {
  user: any
  onClose: () => void
  onUserUpdate: (updatedUser: any) => void
  onLogout: () => void
}

export default function Settings({ user, onClose, onUserUpdate, onLogout }: SettingsProps) {
  const [newUsername, setNewUsername] = useState(user.username || '')
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername === user.username) {
      setError('Please enter a different username')
      return
    }

    setIsChanging(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('🔄 Changing username to:', newUsername)
      const response = await axios.post('/api/change-username', {
        userId: user.id,
        newUsername: newUsername.trim()
      })

      console.log('✅ Username changed successfully')
      setSuccess(true)
      setError(null)
      
      // Update user object
      onUserUpdate({
        ...user,
        username: newUsername.trim()
      })

      // Close after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err: any) {
      console.error('❌ Failed to change username:', err)
      const errorMessage = err.response?.data?.error || 'Failed to change username'
      setError(errorMessage)
      setSuccess(false)
    } finally {
      setIsChanging(false)
    }
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current Username</p>
          <p className="text-lg font-semibold text-gray-800">@{user.username || 'Not set'}</p>
          <p className="text-sm text-gray-500 mt-2">{user.email}</p>
        </div>

        {/* Change Username Form */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Username
          </label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isChanging || success}
          />
          <p className="text-xs text-gray-500 mt-1">
            3-20 characters: letters, numbers, and underscores only
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-700">Username updated successfully!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            disabled={isChanging}
          >
            Cancel
          </button>
          <button
            onClick={handleChangeUsername}
            disabled={isChanging || success || !newUsername || newUsername === user.username}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isChanging ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Updated!
              </>
            ) : (
              'Change Username'
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Danger Zone
          </h3>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isChanging || success}
            className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 m-4">
              <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Delete Account?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                This will permanently delete your account, voice model, photos, chat history, and all associated data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


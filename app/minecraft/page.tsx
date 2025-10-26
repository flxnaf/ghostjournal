'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function MinecraftPage() {
  const { user, isLoading } = useAuth()
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center">
        <p>Please log in to access Minecraft integration</p>
      </div>
    )
  }

  const exportUrl = `${window.location.origin}/api/minecraft/export/${user.id}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJSON = async () => {
    try {
      const response = await fetch(exportUrl)
      const data = await response.json()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `twin-${user.name || 'data'}.json`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download twin data')
    }
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-300">
          🎮 Minecraft Integration
        </h1>

        {/* Twin Info */}
        <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Digital Twin</h2>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Twin Name</label>
              <p className="text-xl font-mono">{user.name || 'Unknown'}</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Twin ID</label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-800 px-3 py-2 rounded flex-1 overflow-x-auto">
                  {user.id}
                </code>
                <button
                  onClick={() => copyToClipboard(user.id)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Export URL</label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-800 px-3 py-2 rounded flex-1 overflow-x-auto">
                  {exportUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(exportUrl)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <button
              onClick={downloadJSON}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold"
            >
              📥 Download Twin Data (JSON)
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Setup Instructions</h2>

          <ol className="space-y-4 list-decimal list-inside">
            <li className="text-lg">
              <span className="font-bold">Install the Digital Twins Mod</span>
              <p className="text-sm text-gray-400 ml-6 mt-1">
                Download the mod JAR file and place it in your Minecraft mods folder
              </p>
            </li>

            <li className="text-lg">
              <span className="font-bold">Import Your Twin</span>
              <div className="bg-gray-800 p-3 rounded mt-2 ml-6">
                <code className="text-sm text-green-400">
                  /twinimport {exportUrl}
                </code>
              </div>
              <p className="text-sm text-gray-400 ml-6 mt-1">
                Or download the JSON and use: <code className="text-cyan-400">/twinimport &lt;file-path&gt;</code>
              </p>
            </li>

            <li className="text-lg">
              <span className="font-bold">Spawn Your Twin in Game</span>
              <div className="bg-gray-800 p-3 rounded mt-2 ml-6">
                <code className="text-sm text-green-400">
                  /twinspawn {user.name || 'YourName'}
                </code>
              </div>
            </li>

            <li className="text-lg">
              <span className="font-bold">Talk to Your Twin!</span>
              <div className="bg-gray-800 p-3 rounded mt-2 ml-6">
                <code className="text-sm text-green-400">
                  /twin {user.name || 'YourName'} Hey, what's your favorite food?
                </code>
              </div>
              <p className="text-sm text-gray-400 ml-6 mt-1">
                Your twin will respond using their personality and memories!
              </p>
            </li>
          </ol>
        </div>

        {/* Additional Commands */}
        <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">Available Commands</h2>

          <div className="space-y-3">
            <div>
              <code className="text-green-400">/twinlist</code>
              <p className="text-sm text-gray-400 ml-6">Show all imported twins</p>
            </div>

            <div>
              <code className="text-green-400">/twinremove &lt;name&gt;</code>
              <p className="text-sm text-gray-400 ml-6">Despawn a twin NPC</p>
            </div>

            <div>
              <code className="text-green-400">/twin &lt;name&gt; &lt;message&gt;</code>
              <p className="text-sm text-gray-400 ml-6">Chat with a twin</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">⚠️ Technical Notes</h2>

          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Requires Minecraft 1.20.1 with Fabric Loader</li>
            <li>• Internet connection required for twin responses</li>
            <li>• Response time: 3-5 seconds (API processing)</li>
            <li>• MVP version uses text-only (no voice in Minecraft yet)</li>
            <li>• Your twin uses the same personality and memories from the web app</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

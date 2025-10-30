'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Copy, Check } from 'lucide-react'

export default function MinecraftPage() {
  const { user, isLoading } = useAuth()
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-cyan-400 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-cyan-400 flex items-center justify-center">
        <p className="text-xl">Please log in to access Minecraft integration</p>
      </div>
    )
  }

  const exportUrl = `${window.location.origin}/api/minecraft/export/${user.id}`

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(item)
    setTimeout(() => setCopiedItem(null), 2000)
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

  const CopyButton = ({ text, item }: { text: string; item: string }) => (
    <button
      onClick={() => copyToClipboard(text, item)}
      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-1.5 transition-colors"
    >
      {copiedItem === item ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </button>
  )

  const CommandBlock = ({ command, description, item }: { command: string; description?: string; item: string }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <code className="text-green-400 font-mono text-sm flex-1">{command}</code>
        <CopyButton text={command} item={item} />
      </div>
      {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-cyan-400">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 text-white">
            Minecraft Integration
          </h1>
          <p className="text-gray-400">
            Deploy your clone to Minecraft with AI personality and voice
          </p>
        </div>

        {/* Export Section */}
        <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">
            Export Your Clone
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">URL (Recommended)</label>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-900 px-3 py-2 rounded flex-1 overflow-x-auto text-gray-300">
                  {exportUrl}
                </code>
                <CopyButton text={exportUrl} item="export-url" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-300 block mb-2">JSON File (Alternative)</label>
              <button
                onClick={downloadJSON}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Setup</h2>

          <p className="text-sm text-gray-400 mb-4">
            Requirements: Minecraft 1.20.1, Fabric Loader, Fabric API, Fabric Language Kotlin
          </p>

          <ol className="space-y-3 text-sm text-gray-300">
            <li>1. Install Fabric Loader and required mods</li>
            <li>2. Build and install the Digital Twins mod</li>
            <li>3. Launch Minecraft 1.20.1</li>
          </ol>
        </div>

        {/* Import Clone */}
        <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Import Clone</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Method 1: URL (Recommended)</p>
              <CommandBlock
                command={`/twinimport ${exportUrl}`}
                item="import-url-command"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Method 2: JSON File</p>
              <CommandBlock
                command="/twinimport ~/Downloads/twin-yourname.json"
                item="import-json-command"
              />
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Usage</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Spawn Clone</p>
              <CommandBlock
                command={`/twinspawn ${user.name || 'YourName'}`}
                item="spawn-command"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Chat with Clone</p>
              <CommandBlock
                command={`/twin ${user.name || 'YourName'} Hey, what's your favorite food?`}
                item="chat-command"
              />
              <p className="text-xs text-gray-400 mt-2">Response includes AI-generated text and voice (3-5s delay)</p>
            </div>
          </div>
        </div>

        {/* Commands */}
        <div className="bg-gray-800 border border-cyan-500 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Commands</h2>

          <div className="space-y-3 text-sm">
            <div>
              <code className="text-cyan-400">/twinimport &lt;url-or-path&gt;</code>
              <p className="text-gray-400 text-xs mt-1">Import clone data</p>
            </div>

            <div>
              <code className="text-cyan-400">/twinlist</code>
              <p className="text-gray-400 text-xs mt-1">Show all imported clones</p>
            </div>

            <div>
              <code className="text-cyan-400">/twinspawn &lt;name&gt;</code>
              <p className="text-gray-400 text-xs mt-1">Spawn clone NPC</p>
            </div>

            <div>
              <code className="text-cyan-400">/twin &lt;name&gt; &lt;message&gt;</code>
              <p className="text-gray-400 text-xs mt-1">Chat with clone</p>
            </div>

            <div>
              <code className="text-cyan-400">/twinremove &lt;name&gt;</code>
              <p className="text-gray-400 text-xs mt-1">Despawn clone NPC</p>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Troubleshooting</h2>

          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>"Twin not found":</strong> Run <code className="text-cyan-400">/twinimport</code> first</p>
            <p><strong>"Connection failed":</strong> Check internet connection and API endpoint</p>
            <p><strong>"Audio playback failed":</strong> Check logs at <code className="text-cyan-400">.minecraft/logs/latest.log</code></p>
            <p><strong>Mod doesn't load:</strong> Verify all dependencies installed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import Anthropic from '@anthropic-ai/sdk'
import { ChromaClient } from 'chromadb'
import axios, { AxiosInstance } from 'axios'

/**
 * Centralized API client configurations
 */

// Anthropic (Claude) Client
export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('Anthropic API key not configured')
    return null
  }
  return new Anthropic({ apiKey })
}

// ChromaDB Client
export async function getChromaClient(): Promise<ChromaClient | null> {
  try {
    const host = process.env.CHROMA_HOST || 'localhost'
    const port = process.env.CHROMA_PORT || '8000'
    
    const client = new ChromaClient({
      path: `http://${host}:${port}`
    })
    
    // Test connection
    await client.heartbeat()
    
    return client
  } catch (error) {
    console.warn('ChromaDB not available:', error)
    return null
  }
}

// Fish Audio Client
export function getFishAudioClient(): AxiosInstance {
  const apiKey = process.env.FISH_AUDIO_API_KEY
  
  return axios.create({
    baseURL: 'https://api.fish.audio/v1',
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      'Content-Type': 'application/json'
    }
  })
}

// Fetch.ai Client
export function getFetchAIClient(): AxiosInstance {
  const apiKey = process.env.FETCH_AI_API_KEY
  
  return axios.create({
    baseURL: 'https://agentverse.ai/v1',
    headers: {
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      'Content-Type': 'application/json'
    }
  })
}


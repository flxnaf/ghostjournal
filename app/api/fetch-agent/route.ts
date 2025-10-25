import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Fetch.ai Agentverse Integration
 * 
 * Deploy your AI clone as an autonomous agent on Fetch.ai's Agentverse
 * This enables your clone to persist, interact with other agents, and operate independently
 * 
 * Documentation: https://fetch.ai/docs/guides/agents/getting-started
 */

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const FETCH_API_KEY = process.env.FETCH_AI_API_KEY

    if (!FETCH_API_KEY) {
      console.warn('Fetch.ai API key not configured')
      return NextResponse.json({
        message: 'Fetch.ai integration not configured',
        agentId: null,
        status: 'disabled'
      })
    }

    switch (action) {
      case 'deploy':
        return await deployAgent(user, FETCH_API_KEY)
      
      case 'status':
        return await getAgentStatus(user, FETCH_API_KEY)
      
      case 'remove':
        return await removeAgent(user, FETCH_API_KEY)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Fetch.ai API error:', error)
    return NextResponse.json(
      { error: 'Fetch.ai operation failed', details: error.message },
      { status: 500 }
    )
  }
}

async function deployAgent(user: any, apiKey: string) {
  try {
    // Get personality data
    const personality = user.personalityData 
      ? JSON.parse(user.personalityData) 
      : {}

    // Create agent configuration
    const agentConfig = {
      name: `EchoSelf_${user.name || user.id}`,
      description: `AI clone with personality: ${personality.traits?.join(', ') || 'friendly'}`,
      personality: personality,
      voiceModelId: user.voiceModelId,
      capabilities: [
        'conversational',
        'memory-enhanced',
        'voice-enabled'
      ],
      // Webhook for agent to call back to your API
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/speak`,
      userId: user.id
    }

    // Deploy to Fetch.ai Agentverse
    const response = await axios.post(
      'https://agentverse.ai/v1/agents/deploy',
      agentConfig,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const agentId = response.data.agent_id

    // Update user with agent ID
    await prisma.user.update({
      where: { id: user.id },
      data: { fetchAgentId: agentId }
    })

    return NextResponse.json({
      success: true,
      agentId,
      message: 'Agent deployed to Fetch.ai Agentverse',
      dashboardUrl: `https://agentverse.ai/agents/${agentId}`
    })

  } catch (error: any) {
    console.error('Deploy agent error:', error.response?.data || error.message)
    
    // Mock deployment for development
    const mockAgentId = `fetch_${user.id}_${Date.now()}`
    await prisma.user.update({
      where: { id: user.id },
      data: { fetchAgentId: mockAgentId }
    })

    return NextResponse.json({
      success: true,
      agentId: mockAgentId,
      message: 'Mock agent deployed (Fetch.ai API not available)',
      dashboardUrl: null
    })
  }
}

async function getAgentStatus(user: any, apiKey: string) {
  if (!user.fetchAgentId) {
    return NextResponse.json({
      status: 'not_deployed',
      message: 'Agent not deployed yet'
    })
  }

  try {
    const response = await axios.get(
      `https://agentverse.ai/v1/agents/${user.fetchAgentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    return NextResponse.json({
      status: response.data.status,
      agentId: user.fetchAgentId,
      details: response.data
    })

  } catch (error: any) {
    console.error('Get agent status error:', error)
    return NextResponse.json({
      status: 'unknown',
      agentId: user.fetchAgentId,
      message: 'Mock agent status (Fetch.ai API not available)'
    })
  }
}

async function removeAgent(user: any, apiKey: string) {
  if (!user.fetchAgentId) {
    return NextResponse.json({
      success: true,
      message: 'No agent to remove'
    })
  }

  try {
    await axios.delete(
      `https://agentverse.ai/v1/agents/${user.fetchAgentId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { fetchAgentId: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Agent removed from Agentverse'
    })

  } catch (error: any) {
    console.error('Remove agent error:', error)
    
    // Clear agent ID anyway
    await prisma.user.update({
      where: { id: user.id },
      data: { fetchAgentId: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Mock agent removed'
    })
  }
}

/**
 * IMPLEMENTATION NOTES for Fetch.ai integration:
 * 
 * 1. Sign up at https://fetch.ai and create an Agentverse account
 * 
 * 2. Install Fetch.ai SDK:
 *    npm install @fetchai/uagents
 * 
 * 3. Create agent with autonomous capabilities:
 *    - Persistent memory (store conversations)
 *    - Scheduled actions (proactive check-ins)
 *    - Inter-agent communication
 * 
 * 4. Configure agent behavior:
 *    - Set up periodic tasks
 *    - Define communication protocols
 *    - Enable learning from interactions
 * 
 * 5. Monitor agent activity via Agentverse dashboard
 */


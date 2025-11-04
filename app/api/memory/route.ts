import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
// ChromaDB disabled for hackathon to avoid webpack issues
// import { ChromaClient } from 'chromadb'

const prisma = new PrismaClient()

// Type for ChromaClient (to avoid import errors)
type ChromaClient = any

/**
 * ChromaDB Integration for Vector Memory Storage
 * 
 * This endpoint handles:
 * 1. Initialize - Create collection and store initial memories
 * 2. Add - Add new memory to collection
 * 3. Query - Retrieve relevant memories for context
 */

/**
 * GET - Fetch all memories for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('📥 GET /api/memory - Fetching memories for:', userId.substring(0, 20))

    // Fetch all memories for the user
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' } // Oldest first to show initial contexts first
    })

    console.log(`✅ Found ${memories.length} memories`)

    return NextResponse.json({ 
      memories,
      count: memories.length
    })

  } catch (error: any) {
    console.error('❌ GET /api/memory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a specific memory
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const memoryId = searchParams.get('memoryId')

    if (!userId || !memoryId) {
      return NextResponse.json({ error: 'User ID and Memory ID required' }, { status: 400 })
    }

    console.log('🗑️ DELETE /api/memory - Deleting memory:', memoryId.substring(0, 20))

    // Verify memory belongs to user before deleting
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId }
    })

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    if (memory.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the memory
    await prisma.memory.delete({
      where: { id: memoryId }
    })

    console.log('✅ Memory deleted')

    return NextResponse.json({ 
      success: true,
      message: 'Memory deleted'
    })

  } catch (error: any) {
    console.error('❌ DELETE /api/memory error:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update a specific memory
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, memoryId, content } = await request.json()

    if (!userId || !memoryId || !content) {
      return NextResponse.json({ error: 'User ID, Memory ID, and content required' }, { status: 400 })
    }

    console.log('✏️ PUT /api/memory - Updating memory:', memoryId.substring(0, 20))
    console.log('   New content length:', content.length)

    // Verify memory belongs to user before updating
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId }
    })

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    if (memory.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the memory
    const updatedMemory = await prisma.memory.update({
      where: { id: memoryId },
      data: { content: content.trim() }
    })

    console.log('✅ Memory updated')

    return NextResponse.json({ 
      success: true,
      message: 'Memory updated',
      memory: updatedMemory
    })

  } catch (error: any) {
    console.error('❌ PUT /api/memory error:', error)
    return NextResponse.json(
      { error: 'Failed to update memory', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('💾 POST /api/memory called')
  try {
    const { userId, action, content, query, category } = await request.json()
    console.log(`   Action: ${action || 'add'}, UserId: ${userId?.substring(0, 10)}...`)
    
    // If no action specified but content is provided, default to 'add'
    if (!action && content) {
      console.log('   No action specified, defaulting to "add"')
      return await handleAddMemory(userId, content, category || 'story')
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if ChromaDB is available, skip if not
    console.log('   Checking ChromaDB availability...')
    const chromaHost = process.env.CHROMA_HOST || 'localhost'
    const chromaPort = process.env.CHROMA_PORT || '8000'
    
    // ChromaDB disabled for hackathon - always use mock storage
    console.log('   ⚠️ ChromaDB disabled, using mock storage (hackathon mode)')
    return handleMockMemory(userId, action, content, query)

    // NOTE: ChromaDB code disabled for hackathon (see handleMockMemory below)
    // If you want to enable ChromaDB, uncomment the code below and install chromadb package
    
    // const collectionName = `user_${userId}`
    // const client = new ChromaClient({ path: `http://${chromaHost}:${chromaPort}` })
    //
    // switch (action) {
    //   case 'initialize':
    //     return await initializeMemories(client, userId, collectionName)
    //   case 'add':
    //     return await addMemory(client, userId, collectionName, content)
    //   case 'query':
    //     return await queryMemories(client, collectionName, query)
    //   default:
    //     return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    // }

  } catch (error: any) {
    console.error('ChromaDB error:', error)
    return NextResponse.json(
      { error: 'Memory operation failed', details: error.message },
      { status: 500 }
    )
  }
}

async function initializeMemories(
  client: ChromaClient, 
  userId: string, 
  collectionName: string
) {
  try {
    // Get or create collection
    let collection
    try {
      collection = await client.getOrCreateCollection({ name: collectionName })
    } catch {
      collection = await client.createCollection({ name: collectionName })
    }

    // Get user memories from database
    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    if (memories.length === 0) {
      return NextResponse.json({ 
        message: 'No memories to initialize',
        count: 0
      })
    }

    // Add memories to Chroma
    const ids = memories.map(m => m.id)
    const documents = memories.map(m => m.content)
    const metadatas = memories.map(m => ({
      category: m.category || 'general',
      createdAt: m.createdAt.toISOString()
    }))

    await collection.add({
      ids,
      documents,
      metadatas
    })

    // Update user with collection ID
    await prisma.user.update({
      where: { id: userId },
      data: { chromaCollectionId: collectionName }
    })

    return NextResponse.json({ 
      message: 'Memories initialized',
      count: memories.length
    })

  } catch (error: any) {
    console.error('Initialize memories error:', error)
    throw error
  }
}

async function addMemory(
  client: ChromaClient,
  userId: string,
  collectionName: string,
  content: string
) {
  try {
    const collection = await client.getCollection({ name: collectionName })

    // Create memory in database
    const memory = await prisma.memory.create({
      data: {
        userId,
        content,
        embedding: '', // Chroma handles embeddings
        category: 'conversation'
      }
    })

    // Add to Chroma
    await collection.add({
      ids: [memory.id],
      documents: [content],
      metadatas: [{
        category: 'conversation',
        createdAt: memory.createdAt.toISOString()
      }]
    })

    return NextResponse.json({ 
      message: 'Memory added',
      memoryId: memory.id
    })

  } catch (error: any) {
    console.error('Add memory error:', error)
    throw error
  }
}

async function queryMemories(
  client: ChromaClient,
  collectionName: string,
  query: string
) {
  try {
    const collection = await client.getCollection({ name: collectionName })

    // Query similar memories
    const results = await collection.query({
      queryTexts: [query],
      nResults: 5
    })

    const memories = results.documents[0]?.map((doc: any, idx: number) => ({
      content: doc,
      metadata: results.metadatas[0]?.[idx],
      distance: results.distances?.[0]?.[idx]
    })) || []

    return NextResponse.json({ 
      memories,
      count: memories.length
    })

  } catch (error: any) {
    console.error('Query memories error:', error)
    throw error
  }
}

/**
 * Helper function to add a memory directly (used by ContextBuilder)
 */
async function handleAddMemory(userId: string, content: string, category: string) {
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  console.log(`💾 Adding memory for user: ${userId.substring(0, 20)}`)
  console.log(`   Category: ${category}`)
  console.log(`   Content length: ${content.length}`)

  try {
    const memory = await prisma.memory.create({
      data: { 
        userId, 
        content: content.trim(), 
        embedding: '', 
        category: category || 'story'
      }
    })
    
    console.log('✅ Memory created:', memory.id)
    
    return NextResponse.json({ 
      success: true,
      message: 'Memory added',
      memoryId: memory.id,
      memory
    })
  } catch (error: any) {
    console.error('❌ Error creating memory:', error)
    return NextResponse.json(
      { error: 'Failed to add memory', details: error.message },
      { status: 500 }
    )
  }
}

// Mock memory storage for when ChromaDB is not available
async function handleMockMemory(
  userId: string, 
  action: string, 
  content?: string, 
  query?: string
) {
  switch (action) {
    case 'initialize':
      const memories = await prisma.memory.findMany({ where: { userId } })
      return NextResponse.json({ 
        message: 'Mock memories initialized',
        count: memories.length
      })
    
    case 'add':
      if (!content) {
        return NextResponse.json({ error: 'Content required' }, { status: 400 })
      }
      const memory = await prisma.memory.create({
        data: { userId, content, embedding: 'mock', category: 'conversation' }
      })
      return NextResponse.json({ 
        message: 'Mock memory added',
        memoryId: memory.id
      })
    
    case 'query':
      // Return random memories as mock
      const allMemories = await prisma.memory.findMany({ 
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ 
        memories: allMemories.map(m => ({
          content: m.content,
          metadata: { category: m.category }
        })),
        count: allMemories.length
      })
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}


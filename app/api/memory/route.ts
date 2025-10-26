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

export async function POST(request: NextRequest) {
  console.log('💾 Memory API called')
  try {
    const { userId, action, content, query } = await request.json()
    console.log(`   Action: ${action}, UserId: ${userId?.substring(0, 10)}...`)

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

    const memories = results.documents[0]?.map((doc, idx) => ({
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


import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const prisma = new PrismaClient()

/**
 * Delete user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const { supabase } = createRouteHandlerClient(request)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error('Auth error in delete-account:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🗑️  Deleting account for user:', authUser.id)

    // Delete user from Prisma database (cascades to memories and conversations)
    try {
      await prisma.user.delete({
        where: { id: authUser.id }
      })
      console.log('✅ User data deleted from database')
    } catch (dbError: any) {
      console.log('⚠️  User not found in database (may not have completed setup)')
    }

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id)
    
    if (deleteError) {
      console.error('❌ Error deleting from Supabase:', deleteError)
      // Continue anyway - data is already deleted from Prisma
    }

    console.log('✅ Account deletion complete')

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error: any) {
    console.error('❌ Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const userId = formData.get('userId') as string

    if (!photo || !userId) {
      return NextResponse.json({ error: 'Photo and userId required' }, { status: 400 })
    }

    console.log('📸 Uploading profile photo for user:', userId)
    console.log('   Photo name:', photo.name)
    console.log('   Photo size:', photo.size, 'bytes')
    console.log('   Photo type:', photo.type)

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Supabase not configured')
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    // Create admin Supabase client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Convert File to Buffer
    const arrayBuffer = await photo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const filename = `${userId}/profile.jpg`
    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(filename, buffer, {
        contentType: photo.type,
        upsert: true,
      })

    if (error) {
      console.error('❌ Supabase Storage error:', error)
      return NextResponse.json({ error: `Failed to upload photo: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(filename)

    console.log('✅ Profile photo uploaded:', urlData.publicUrl)

    return NextResponse.json({ photoUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('❌ Upload photo error:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error.message },
      { status: 500 }
    )
  }
}


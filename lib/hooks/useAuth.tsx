'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createClient } from '../supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Supabase Auth Hook
 * 
 * Replaces the temporary localStorage auth with Supabase authentication.
 * 
 * Data structure stored in Supabase:
 * - User profile (email, name, id)
 * - Voice clone data (voiceModelId)
 * - Face data (faceContours)
 * - Personality context (stories, habits, reactions)
 * - Chat history (summarized for context)
 * - Memories (vector embeddings)
 */

interface User {
  id: string
  email: string
  name?: string
  username?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Helper function to convert Supabase user to our User interface
  const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
    username: supabaseUser.user_metadata?.username,
    createdAt: supabaseUser.created_at
  })

  // Check for existing session on mount
  useEffect(() => {
    // Check for admin bypass first
    const isAdminBypass = localStorage.getItem('adminBypass')
    const adminUserStr = localStorage.getItem('adminUser')
    
    if (isAdminBypass === 'true' && adminUserStr) {
      console.log('🔑 Admin bypass detected')
      try {
        const adminUser = JSON.parse(adminUserStr)
        setUser(adminUser)
        setIsLoading(false)
        return
      } catch (error) {
        console.error('Error parsing admin user:', error)
        localStorage.removeItem('adminBypass')
        localStorage.removeItem('adminUser')
      }
    }
    
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseKey === 'placeholder-key') {
      console.error('❌ Supabase not configured. Please set environment variables in Railway.')
      setIsLoading(false)
      return
    }
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else if (session?.user) {
          setUser(convertSupabaseUser(session.user))
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(convertSupabaseUser(session.user))
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signup = async (email: string, password: string, name?: string) => {
    // For admin bypass, name is actually the username
    const username = name
    const displayName = email // In signup form, we swapped these
    
    // Create email from username if not provided
    const userEmail = displayName && displayName.includes('@') ? displayName : `${username}@replik.local`
    
    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password,
      options: {
        data: {
          username: username,
          name: displayName || username
        }
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      const user = convertSupabaseUser(data.user)
      user.username = username
      setUser(user)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    // Determine if input is email or username
    const isEmail = emailOrUsername.includes('@')
    const loginEmail = isEmail ? emailOrUsername : `${emailOrUsername}@replik.local`
    
    const { data, error} = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      setUser(convertSupabaseUser(data.user))
    }
  }

  const logout = async () => {
    // Check if this is an admin bypass session
    const isAdminBypass = localStorage.getItem('adminBypass')
    
    if (isAdminBypass === 'true') {
      localStorage.removeItem('adminBypass')
      localStorage.removeItem('adminUser')
      setUser(null)
      return
    }
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
    }
    
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

